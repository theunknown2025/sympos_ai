import type {
  CommitteeMember,
  CommitteePersonLink,
  ReviewCommitteeMember,
  ScientificCommitteeConfig,
  ScientificCommitteePerson,
  ScientificSubCommittee,
  SocialLink,
} from '../types';

export function newPersonId(): string {
  return `scp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newSubCommitteeId(): string {
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyPerson(partial?: Partial<ScientificCommitteePerson>): ScientificCommitteePerson {
  return {
    id: newPersonId(),
    name: '',
    role: '',
    establishment: '',
    email: '',
    bio: '',
    imageUrl: '',
    linkedin: '',
    links: [],
    ...partial,
  };
}

export function createEmptySubCommittee(partial?: Partial<ScientificSubCommittee>): ScientificSubCommittee {
  return {
    id: newSubCommitteeId(),
    name: '',
    icon: 'users',
    chair: createEmptyPerson(),
    members: [],
    ...partial,
  };
}

export function createEmptyScientificCommittee(): ScientificCommitteeConfig {
  return {
    eventChair: null,
    subCommittees: [],
  };
}

function socialToLinks(socials: SocialLink[] | undefined): { linkedin: string; links: CommitteePersonLink[] } {
  let linkedin = '';
  const links: CommitteePersonLink[] = [];
  let n = 0;
  for (const s of socials || []) {
    if (s.platform === 'linkedin') {
      linkedin = s.url;
      continue;
    }
    const url = s.url.trim();
    if (!url) continue;
    links.push({
      id: s.id || `link-${n++}`,
      type: 'other',
      label: s.platform,
      url,
    });
  }
  return { linkedin, links };
}

export function legacyMemberToPerson(
  member: CommitteeMember,
  defaultRole?: string
): ScientificCommitteePerson {
  const { linkedin, links } = socialToLinks(member.socials);
  return {
    id: member.id,
    name: member.name || '',
    role: member.role || defaultRole || '',
    establishment: member.affiliation || '',
    email: '',
    bio: member.bio || '',
    imageUrl: member.imageUrl || '',
    linkedin,
    links,
  };
}

function inferMainFieldName(members: CommitteeMember[]): string {
  const president = members.find((m) => m.landingTier === 'president');
  if (president?.subcommitteeName) return president.subcommitteeName;
  const firstSubChairIdx = members.findIndex((m) => m.landingTier === 'subcommittee_chair');
  const before = firstSubChairIdx === -1 ? members : members.slice(0, firstSubChairIdx);
  const firstMain = before.find((m) => m.landingTier === 'member' && m.subcommitteeName);
  return firstMain?.subcommitteeName ?? '';
}

export function migrateLegacyCommittee(members: CommitteeMember[]): ScientificCommitteeConfig {
  if (!Array.isArray(members) || members.length === 0) {
    return createEmptyScientificCommittee();
  }

  const structured = members.some((m) => m.landingTier);
  if (!structured) {
    const [first, ...rest] = members;
    return {
      eventChair: legacyMemberToPerson(first, 'Event Chair'),
      subCommittees:
        rest.length > 0
          ? [
              {
                id: newSubCommitteeId(),
                name: 'Committee Members',
                icon: 'users',
                chair: createEmptyPerson(),
                members: rest.map((m) => legacyMemberToPerson(m)),
              },
            ]
          : [],
    };
  }

  const mainName = inferMainFieldName(members);
  const president = members.find((m) => m.landingTier === 'president');
  const eventChair = president ? legacyMemberToPerson(president) : null;

  const mainMembers: CommitteeMember[] = [];
  const subSections: { fieldName: string; chair: CommitteeMember; members: CommitteeMember[] }[] = [];

  for (const m of members) {
    if (!m.landingTier) continue;
    if (m.landingTier === 'president') continue;
    if (m.landingTier === 'member' && m.subcommitteeName === mainName) {
      mainMembers.push(m);
      continue;
    }
    if (m.landingTier === 'subcommittee_chair') {
      subSections.push({
        fieldName: m.subcommitteeName || '',
        chair: m,
        members: [],
      });
      continue;
    }
    if (m.landingTier === 'member' && m.subcommitteeName !== mainName) {
      const last = subSections[subSections.length - 1];
      if (last && m.subcommitteeName === last.fieldName) {
        last.members.push(m);
      }
    }
  }

  const subCommittees: ScientificSubCommittee[] = [];

  if (mainMembers.length > 0 && mainName) {
    subCommittees.push({
      id: newSubCommitteeId(),
      name: mainName,
      icon: 'network',
      chair: createEmptyPerson(),
      members: mainMembers.map((m) => legacyMemberToPerson(m)),
    });
  }

  for (const sub of subSections) {
    subCommittees.push({
      id: newSubCommitteeId(),
      name: sub.fieldName,
      icon: 'microscope',
      chair: legacyMemberToPerson(sub.chair),
      members: sub.members.map((m) => legacyMemberToPerson(m)),
    });
  }

  const untiered = members.filter((m) => !m.landingTier);
  if (untiered.length > 0) {
    subCommittees.push({
      id: newSubCommitteeId(),
      name: 'Additional Members',
      icon: 'users',
      chair: createEmptyPerson(),
      members: untiered.map((m) => legacyMemberToPerson(m)),
    });
  }

  return { eventChair, subCommittees };
}

export function resolveScientificCommittee(config: {
  scientificCommittee?: ScientificCommitteeConfig;
  committee?: CommitteeMember[];
}): ScientificCommitteeConfig {
  if (config.scientificCommittee) {
    return normalizeScientificCommittee(config.scientificCommittee);
  }
  return migrateLegacyCommittee(config.committee || []);
}

function normalizePerson(raw: unknown): ScientificCommitteePerson | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as ScientificCommitteePerson;
  const links = Array.isArray(p.links)
    ? p.links
        .filter((l) => l && typeof l === 'object' && typeof l.url === 'string')
        .map((l) => ({
          id: l.id || newPersonId(),
          type: l.type === 'orcid' || l.type === 'google_scholar' || l.type === 'other' ? l.type : 'other',
          label: typeof l.label === 'string' ? l.label : undefined,
          url: l.url,
        }))
    : [];
  return {
    id: typeof p.id === 'string' ? p.id : newPersonId(),
    name: typeof p.name === 'string' ? p.name : '',
    role: typeof p.role === 'string' ? p.role : '',
    establishment: typeof p.establishment === 'string' ? p.establishment : '',
    email: typeof p.email === 'string' ? p.email : '',
    bio: typeof p.bio === 'string' ? p.bio : '',
    imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : '',
    linkedin: typeof p.linkedin === 'string' ? p.linkedin : '',
    links,
  };
}

export function normalizeScientificCommittee(raw: ScientificCommitteeConfig): ScientificCommitteeConfig {
  const eventChairRaw = raw?.eventChair;
  const eventChair =
    eventChairRaw && typeof eventChairRaw === 'object' ? normalizePerson(eventChairRaw) : null;

  const subCommittees = Array.isArray(raw?.subCommittees)
    ? raw.subCommittees
        .filter((s) => s && typeof s === 'object')
        .map((s) => {
          const chair = normalizePerson(s.chair) || createEmptyPerson();
          const members = Array.isArray(s.members)
            ? (s.members.map((m) => normalizePerson(m)).filter(Boolean) as ScientificCommitteePerson[])
            : [];
          return {
            id: typeof s.id === 'string' ? s.id : newSubCommitteeId(),
            name: typeof s.name === 'string' ? s.name : '',
            icon: s.icon || 'users',
            chair,
            members,
          };
        })
    : [];

  return { eventChair, subCommittees };
}

function formatAffiliation(a: ReviewCommitteeMember['affiliation']): string {
  if (!a || typeof a !== 'object') return '';
  const bits = [
    a.position,
    a.institution || a.university || a.organization,
    a.department,
    a.faculty,
    a.country,
  ].filter(Boolean);
  return [...new Set(bits.map(String))].join(' · ');
}

function reviewToPerson(rm: ReviewCommitteeMember, role: string): ScientificCommitteePerson {
  const name = [rm.title, rm.firstName, rm.lastName].filter(Boolean).join(' ').trim();
  const links: CommitteePersonLink[] = [];
  let n = 0;
  const { identifiers } = rm;
  if (identifiers.orcidId) {
    const u = identifiers.orcidId.trim();
    links.push({
      id: `orcid-${rm.id}-${n++}`,
      type: 'orcid',
      url: u.includes('/') ? u : `https://orcid.org/${u}`,
    });
  }
  if (identifiers.googleScholar) {
    links.push({
      id: `gs-${rm.id}-${n++}`,
      type: 'google_scholar',
      url: identifiers.googleScholar,
    });
  }
  for (const link of identifiers.otherLinks || []) {
    if (link?.trim()) {
      links.push({
        id: `other-${rm.id}-${n++}`,
        type: 'other',
        url: link.startsWith('http') ? link : `https://${link}`,
      });
    }
  }
  return {
    id: `rcm-${rm.id}`,
    name,
    role,
    establishment: formatAffiliation(rm.affiliation),
    email: rm.email || '',
    bio: '',
    imageUrl: '',
    linkedin: '',
    links,
  };
}

function orderedUniqueMemberIds(field: {
  chairMemberId?: string | null;
  memberIds: string[];
}): string[] {
  const orderedIds: string[] = [];
  const added = new Set<string>();
  if (field.chairMemberId) {
    orderedIds.push(field.chairMemberId);
    added.add(field.chairMemberId);
  }
  for (const mid of field.memberIds) {
    if (!added.has(mid)) {
      orderedIds.push(mid);
      added.add(mid);
    }
  }
  return orderedIds;
}

export function buildScientificCommitteeFromSaved(
  saved: {
    fieldsOfIntervention: Array<{
      name: string;
      chairMemberId?: string | null;
      memberIds: string[];
    }>;
  },
  membersById: Map<string, ReviewCommitteeMember>,
  labels: {
    president: string;
    mainMember: (field: string) => string;
    subChair: (field: string) => string;
    subMember: (field: string) => string;
  }
): ScientificCommitteeConfig {
  const fields = saved.fieldsOfIntervention;
  if (fields.length === 0) return createEmptyScientificCommittee();

  const seen = new Set<string>();
  const mainField = fields[0];
  const restFields = fields.slice(1);

  let eventChair: ScientificCommitteePerson | null = null;
  const mainMembers: ScientificCommitteePerson[] = [];

  if (mainField.chairMemberId) {
    const rm = membersById.get(mainField.chairMemberId);
    if (rm) {
      seen.add(mainField.chairMemberId);
      eventChair = reviewToPerson(rm, labels.president);
    }
  }

  for (const memberId of orderedUniqueMemberIds(mainField)) {
    if (seen.has(memberId)) continue;
    const rm = membersById.get(memberId);
    if (!rm) continue;
    seen.add(memberId);
    mainMembers.push(reviewToPerson(rm, labels.mainMember(mainField.name)));
  }

  const subCommittees: ScientificSubCommittee[] = [];

  if (mainMembers.length > 0) {
    subCommittees.push({
      id: newSubCommitteeId(),
      name: mainField.name,
      icon: 'network',
      chair: createEmptyPerson(),
      members: mainMembers,
    });
  }

  for (const field of restFields) {
    let chair = createEmptyPerson();
    const members: ScientificCommitteePerson[] = [];

    if (field.chairMemberId && !seen.has(field.chairMemberId)) {
      const rm = membersById.get(field.chairMemberId);
      if (rm) {
        seen.add(field.chairMemberId);
        chair = reviewToPerson(rm, labels.subChair(field.name));
      }
    }

    for (const memberId of orderedUniqueMemberIds(field)) {
      if (seen.has(memberId)) continue;
      const rm = membersById.get(memberId);
      if (!rm) continue;
      seen.add(memberId);
      members.push(reviewToPerson(rm, labels.subMember(field.name)));
    }

    if (chair.name || members.length > 0) {
      subCommittees.push({
        id: newSubCommitteeId(),
        name: field.name,
        icon: 'microscope',
        chair,
        members,
      });
    }
  }

  return { eventChair, subCommittees };
}

export function committeeHasContent(config: ScientificCommitteeConfig): boolean {
  if (config.eventChair?.name?.trim()) return true;
  return config.subCommittees.some(
    (s) => s.name.trim() || s.chair.name.trim() || s.members.some((m) => m.name.trim())
  );
}

export function normalizePersonLinkUrl(url: string): string {
  const u = url.trim();
  if (!u) return '';
  return u.startsWith('http') ? u : `https://${u}`;
}

export function sampleScientificCommitteeFromLegacy(
  committee: CommitteeMember[]
): ScientificCommitteeConfig {
  return migrateLegacyCommittee(committee);
}
