/**
 * AI Poster prompt architecture for gpt-image-1.
 *
 * Prompt sections are built by dedicated helpers and assembled in a fixed order.
 * Image references are semantic objects { index, role, description, priority }.
 *
 * Used by: server/ai-poster-api.js
 */

/** @typedef {'org_logo' | 'partner_logo' | 'speaker' | 'hero_banner'} ReferenceRole */

/**
 * @typedef {object} ImageReference
 * @property {number} index - 1-based IMAGE N index (matches multipart upload order)
 * @property {ReferenceRole} role
 * @property {string} description - Semantic instructions for the model
 * @property {number} priority - Higher = more critical to preserve (1–10)
 * @property {{ mimeType: string, buffer: Buffer }} asset - Binary payload for OpenAI edits
 * @property {string} [name] - Optional display name
 */

const MAX_REFERENCES = 10;

const SECTION = (title) => [``, `══ ${title} ══`, ``];

function joinSections(parts) {
  return parts
    .flat()
    .filter((line) => line !== null && line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shortLabel(text, max = 48) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function truncateForLayout(text, max = 90) {
  const value = String(text || '').trim();
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

// ─── Image references ─────────────────────────────────────────────────────────

/**
 * Build semantic image references from poster form data.
 * Order is upload order for OpenAI edits (IMAGE 1, IMAGE 2, …).
 *
 * Priority: org logos (10) → speakers (9) → partner logos (7) → hero banner (4).
 *
 * @param {object} info
 * @param {(dataUrl: string) => ({ mimeType: string, buffer: Buffer } | null)} parseDataUrl
 * @returns {ImageReference[]}
 */
export function collectReferenceImages(info = {}, parseDataUrl) {
  if (typeof parseDataUrl !== 'function') {
    throw new Error('collectReferenceImages requires a parseDataUrl(dataUrl) function');
  }

  /** @type {Omit<ImageReference, 'index'>[]} */
  const pending = [];

  for (const logo of info.organizerLogos || []) {
    if (!logo?.image) continue;
    const asset = parseDataUrl(logo.image);
    if (!asset) continue;
    pending.push({
      role: 'org_logo',
      name: logo.name || 'Organization',
      priority: 10,
      description: [
        `Official organization logo${logo.name ? ` (“${logo.name}”)` : ''}.`,
        `Do not redesign. Do not restyle. Do not invent a substitute.`,
        `Preserve exact artwork, colors, and aspect ratio.`,
        `Keep perfectly readable inside a clean top branding strip.`,
      ].join(' '),
      asset,
    });
  }

  const speakers = Array.isArray(info.speakers)
    ? info.speakers.filter((s) => s?.enabled && String(s.name || '').trim())
    : [];

  for (const speaker of speakers.slice(0, 4)) {
    if (!speaker.image) continue;
    const asset = parseDataUrl(speaker.image);
    if (!asset) continue;
    pending.push({
      role: 'speaker',
      name: speaker.name,
      priority: 9,
      description: [
        `Featured speaker portrait of ${speaker.name}.`,
        speaker.position ? `Title: ${speaker.position}.` : '',
        speaker.establishment ? `Institution: ${speaker.establishment}.` : '',
        `Maintain exact facial identity. Do not invent a different person.`,
        `Treat as a professional corporate headshot.`,
        `Place inside a rounded speaker card with soft shadow (conference branding style).`,
      ]
        .filter(Boolean)
        .join(' '),
      asset,
    });
  }

  for (const logo of info.partnerLogos || []) {
    if (!logo?.image) continue;
    const asset = parseDataUrl(logo.image);
    if (!asset) continue;
    pending.push({
      role: 'partner_logo',
      name: logo.name || 'Partner',
      priority: 7,
      description: [
        `Official partner logo${logo.name ? ` (“${logo.name}”)` : ''}.`,
        `Do not redesign. Preserve exact artwork and aspect ratio.`,
        `Keep readable in the footer partner strip.`,
      ].join(' '),
      asset,
    });
  }

  if (info.bannerImage) {
    const asset = parseDataUrl(info.bannerImage);
    if (asset) {
      pending.push({
        role: 'hero_banner',
        name: 'Hero banner',
        priority: 4,
        description: [
          `Hero banner inspiration image.`,
          `Use only as inspiration for mood, palette, and subject matter.`,
          `Do not crop or paste it directly as a photo panel.`,
          `Integrate its spirit into one unified vector-style hero illustration.`,
        ].join(' '),
        asset,
      });
    }
  }

  // Stable order: priority desc, then original insertion order
  pending.sort((a, b) => b.priority - a.priority);

  return pending.slice(0, MAX_REFERENCES).map((item, i) => ({
    ...item,
    index: i + 1,
  }));
}

/**
 * Format semantic references into the IMAGE REFERENCES prompt section.
 * @param {ImageReference[]} references
 */
export function buildImageReferencesSection(references = []) {
  if (!references.length) {
    return joinSections([
      SECTION('IMAGE REFERENCES'),
      `No uploaded assets were provided.`,
      `Use clean placeholder logo marks (LOGO 1 / LOGO 2 / LOGO 3) in the branding strip.`,
      `Use elegant placeholder speaker cards with short Name / Title / Institution labels.`,
      `Do not invent realistic fake logos or fake celebrity faces.`,
    ]);
  }

  const blocks = references.map((ref) =>
    [
      `IMAGE ${ref.index}`,
      `Role: ${ref.role}`,
      `Priority: ${ref.priority}/10`,
      ref.name ? `Name: ${ref.name}` : null,
      ref.description,
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return joinSections([
    SECTION('IMAGE REFERENCES'),
    `Use the following input images exactly as instructed. Indices match upload order.`,
    ...blocks.flatMap((block, i) => (i === 0 ? [block] : ['', block])),
  ]);
}

// ─── Prompt section builders ──────────────────────────────────────────────────

export function buildSystemRole() {
  return joinSections([
    SECTION('SYSTEM ROLE'),
    `You are an award-winning conference poster designer with 20 years of experience designing posters for international conferences, universities, and innovation summits.`,
    `You design like a senior art director at a top studio — not like a generative-AI collage tool.`,
    `Your layouts are editorial, disciplined, and print-ready.`,
  ]);
}

export function buildDesignObjective(info = {}, widthPx, heightPx) {
  const title = info.title || 'the event';
  return joinSections([
    SECTION('DESIGN OBJECTIVE'),
    `Design a premium academic / innovation conference poster for: “${title}”.`,
    `Canvas: ${widthPx}×${heightPx}px, A4 portrait orientation.`,
    `This is a high-end event poster for universities, innovation hubs, NGOs, startups, public institutions, and international organizations.`,
    `The result must look professionally designed by a human art director — never look AI-generated, cluttered, or randomly composed.`,
    `Prioritize layout, hierarchy, spacing, and visual integration over rendering long paragraphs of text.`,
  ]);
}

export function buildDesignReferences() {
  return joinSections([
    SECTION('DESIGN REFERENCES'),
    `Visual and layout inspiration (quality bar, not copying):`,
    `- Adobe MAX`,
    `- TEDx`,
    `- Apple WWDC`,
    `- Google I/O`,
    `- Web Summit`,
    `- MIT Media Lab`,
    `- World Economic Forum`,
    `- UNESCO institutional campaigns`,
    `Think: luxury conference branding, magazine covers, and premium keynote collateral.`,
  ]);
}

export function buildLayoutGrid() {
  return joinSections([
    SECTION('LAYOUT GRID'),
    `Use a strict editorial grid with consistent left/right margins (~6–8% of width) and even vertical rhythm.`,
    `Approximate vertical allocation (must total ~100%):`,
    ``,
    `1) Top branding strip .............. ~6%`,
    `2) Large title + subtitle ........... ~10%`,
    `3) Hero illustration ................ ~40%`,
    `4) Information cards (date/place/time) ~7%`,
    `5) Themes / icon row ................ ~8%`,
    `6) Speakers row ..................... ~14%`,
    `7) Call to action + QR .............. ~10%`,
    `8) Footer partners + border ......... ~5%`,
    ``,
    `Construction order (follow strictly):`,
    `A. Design the page layout / grid first`,
    `B. Generate the unified hero illustration inside its reserved band`,
    `C. Populate information cards`,
    `D. Insert speaker cards`,
    `E. Insert logos into branding strips`,
    `F. Reserve the QR area with clean margins`,
    ``,
    `Every zone must be aligned to the grid. No floating elements. No overlapping sections.`,
  ]);
}

export function buildHeroIllustration() {
  return joinSections([
    SECTION('HERO ILLUSTRATION'),
    `Create ONE unified hero illustration occupying about 40% of the poster height.`,
    `It must feel like a single composed artwork — not a collage, not a moodboard, not disconnected stickers.`,
    ``,
    `Merge these subjects into one scene with glowing digital connection lines:`,
    `entrepreneurs, women leaders, students, healthcare, universities, agriculture, renewable energy, digital technologies.`,
    ``,
    `Style: high-end vector / editorial illustration with subtle depth, clean shapes, and cohesive lighting.`,
    `Avoid photographic cutouts pasted side-by-side. Avoid duplicated people. Avoid random icon scatter.`,
    `The illustration must sit inside its reserved band and integrate with the poster’s color system.`,
  ]);
}

export function buildTypography() {
  return joinSections([
    SECTION('TYPOGRAPHY'),
    `Typography must look like professional conference branding (Montserrat / Poppins / Inter family feel).`,
    `- One dominant large title with excellent kerning and tracking`,
    `- Clear hierarchy: title ≫ subtitle ≫ section labels ≫ body labels`,
    `- Consistent baseline spacing and even gaps between sections`,
    `- No distorted, warped, melted, or misspelled text`,
    `- Minimal text overall — this is a visual poster, not a brochure page`,
    `- Short labels only on cards (Date / Location / Time / Register)`,
    `- For any long description area, render a short realistic placeholder block such as “Lorem brief · 2 lines” instead of a full paragraph`,
    `Never crowd the title into the hero illustration.`,
  ]);
}

export function buildColorPalette() {
  return joinSections([
    SECTION('COLOR PALETTE'),
    `Use this Moroccan-inspired institutional palette:`,
    `- Deep Green #006233 — primary structure, titles, icons`,
    `- Moroccan Red #C1272D — accents, CTA emphasis, secondary title stress`,
    `- Gold #C9A227 — fine highlights, thin rules, premium details`,
    `- White #FFFFFF — cards, logo plates, breathing room`,
    `- Warm Beige #F5F0E8 — page background with soft paper texture`,
    ``,
    `Distribution: beige field dominant; green for structure; red sparingly for emphasis; gold as thin luxury accent only.`,
    `Keep contrast high for print readability. Avoid neon glow and muddy gradients.`,
  ]);
}

export function buildIconography() {
  return joinSections([
    SECTION('ICONOGRAPHY'),
    `Use professional line icons with consistent stroke width and corner radius.`,
    `Minimalist, geometric, and aligned in a grid.`,
    `One icon per theme/info item — never duplicate icons or stack random symbols.`,
    `Icons should support the layout, never compete with the hero illustration.`,
  ]);
}

/**
 * @param {object} info
 * @param {ImageReference[]} references
 */
export function buildContentBrief(info = {}, references = []) {
  const speakers = Array.isArray(info.speakers)
    ? info.speakers.filter((s) => s?.enabled && String(s.name || '').trim())
    : [];
  const themes = (info.themes || []).map((t) => String(t || '').trim()).filter(Boolean).slice(0, 8);
  const hasSpeakerPhotos = references.some((r) => r.role === 'speaker');
  const hasOrgLogos = references.some((r) => r.role === 'org_logo');
  const hasPartnerLogos = references.some((r) => r.role === 'partner_logo');

  const themeLine = themes.length
    ? themes.map((t) => shortLabel(t, 28)).join(' · ')
    : 'Innovation · Sustainability · Inclusion · Technology';

  const speakerLines = speakers.length
    ? speakers
        .slice(0, 4)
        .map((s, i) => {
          const name = shortLabel(s.name, 28) || `Speaker ${i + 1}`;
          const title = shortLabel(s.position || 'Title', 24);
          const institution = shortLabel(s.establishment || 'Institution', 28);
          return `${i + 1}. ${name} — ${title} — ${institution}`;
        })
        .join('\n')
    : '1–4 elegant placeholder speaker cards (Name / Title / Institution).';

  return joinSections([
    SECTION('CONTENT BRIEF (SHORT LABELS ONLY)'),
    `Use these short labels. Do NOT render long paragraphs.`,
    ``,
    `Title: ${shortLabel(info.title || 'Conference Title', 60)}`,
    `Subtitle: ${shortLabel(info.slogan || 'Conference subtitle', 72)}`,
    `Date: ${shortLabel(info.date || 'Date TBD', 36)}`,
    `Time: ${shortLabel(info.time || 'Time TBD', 24)}`,
    `Location: ${shortLabel(info.place || 'Venue TBD', 56)}`,
    ``,
    `About area: use a 1–2 line placeholder text block only (do not typeset the full about paragraph).`,
    info.about ? `About gist (for layout mood only, do not print in full): ${truncateForLayout(info.about, 100)}` : null,
    ``,
    `Themes (icon + short label): ${themeLine}`,
    ``,
    `Speakers:`,
    speakerLines,
    hasSpeakerPhotos
      ? `Speaker photos are provided as IMAGE references — preserve exact faces.`
      : `No speaker photos — use tasteful silhouette / placeholder portrait discs.`,
    ``,
    `CTA: ${shortLabel(info.ctaText || 'Register Now', 28)}`,
    `CTA note: ${shortLabel(info.ctaSubtext || 'Seats are limited', 32)}`,
    `QR label: ${shortLabel(info.qrLabel || 'Scan to Register', 28)}`,
    ``,
    `Contact (tiny footer labels): ${[
      shortLabel(info.contactWebsite, 28),
      shortLabel(info.contactEmail, 28),
      shortLabel(info.contactPhone, 20),
    ]
      .filter(Boolean)
      .join(' · ') || 'website · email · phone'}`,
    ``,
    hasOrgLogos
      ? `Top logos: use provided organization IMAGE references in the branding strip.`
      : `Top logos: LOGO 1 · LOGO 2 · LOGO 3 placeholders.`,
    hasPartnerLogos
      ? `Footer partners: use provided partner IMAGE references.`
      : `Footer partners: small placeholder marks.`,
  ]);
}

/**
 * @param {ImageReference[]} references
 */
export function buildSpeakerCards(references = []) {
  const speakerRefs = references.filter((r) => r.role === 'speaker');
  return joinSections([
    SECTION('SPEAKER CARDS'),
    `Design 3–4 elegant horizontal/vertical speaker cards in one aligned row or 2×2 grid.`,
    `Rounded card, soft shadow, generous internal padding, consistent card height.`,
    `Corporate conference style (Web Summit / Adobe MAX quality).`,
    speakerRefs.length
      ? `Provided speaker images (IMAGE ${speakerRefs.map((r) => r.index).join(', ')}): keep exact faces, professional headshot crop, no distortion.`
      : `No photos provided: use consistent placeholder portrait circles and short Name / Title / Institution labels.`,
    `Never duplicate a speaker. Never stretch faces. Never place cards overlapping the hero.`,
  ]);
}

/**
 * @param {ImageReference[]} references
 */
export function buildLogos(references = []) {
  const org = references.filter((r) => r.role === 'org_logo');
  const partners = references.filter((r) => r.role === 'partner_logo');
  return joinSections([
    SECTION('LOGOS'),
    `If logos are provided: never redesign them. Preserve aspect ratio. Keep them perfectly readable.`,
    `Place organization logos inside a clean top branding strip on white or soft beige plates.`,
    `Place partner logos in a calm footer strip with even spacing.`,
    org.length ? `Organization logo IMAGE indices: ${org.map((r) => r.index).join(', ')}.` : `Use LOGO placeholders if none uploaded.`,
    partners.length
      ? `Partner logo IMAGE indices: ${partners.map((r) => r.index).join(', ')}.`
      : `Partner strip may use subtle placeholders.`,
    `No stretched, skewed, recolored, or warped logos.`,
  ]);
}

export function buildQrCode(info = {}) {
  return joinSections([
    SECTION('QR CODE'),
    `Reserve a clean square QR placeholder in the lower CTA zone (typically bottom-right).`,
    `Realistic QR pattern, centered inside a white plate with a large quiet margin.`,
    `Label below: “${shortLabel(info.qrLabel || 'Scan to Register', 28)}”.`,
    `Do not make the QR tiny, tilted, or overlapping other elements.`,
  ]);
}

export function buildNegativePrompt() {
  return joinSections([
    SECTION('NEGATIVE PROMPT — FORBIDDEN'),
    `Strictly avoid:`,
    `clutter, collage, moodboard layout, random overlapping elements,`,
    `cartoon / comic style, sticker storm, duplicated people, duplicated icons,`,
    `blurry text, warped text, misspelled words, long unreadable paragraphs,`,
    `stretched logos, redesigned logos, distorted faces, inconsistent lighting,`,
    `floating text, poor alignment, uneven gaps, bad margins, edge collisions,`,
    `neon glow spam, low-contrast mud, amateur Canva clutter, AI artifact mess.`,
  ]);
}

export function buildQualityRequirements(widthPx, heightPx) {
  return joinSections([
    SECTION('QUALITY REQUIREMENTS'),
    `Professional editorial layout.`,
    `Print-ready appearance, 300 DPI look, A4 portrait (${widthPx}×${heightPx}px).`,
    `Magazine quality. Award-winning conference poster.`,
    `Perfect spacing. Clean composition. Consistent margins.`,
    `Luxury branding. High-end vector illustration.`,
    `Adobe Illustrator / senior art-direction quality.`,
    `The poster must look intentional, premium, and human-designed.`,
  ]);
}

// ─── Assembler ────────────────────────────────────────────────────────────────

/**
 * Assemble the full gpt-image-1 prompt in the required section order.
 *
 * @param {object} info - Poster form content
 * @param {number} widthPx
 * @param {number} heightPx
 * @param {ImageReference[]} [references]
 * @returns {string}
 */
export function buildAiPosterPrompt(info = {}, widthPx = 1024, heightPx = 1536, references = []) {
  // Backward compatible: accept string[] labels from older callers
  const normalizedRefs = Array.isArray(references)
    ? references.map((ref, i) => {
        if (typeof ref === 'string') {
          return {
            index: i + 1,
            role: 'hero_banner',
            description: ref,
            priority: 5,
            asset: null,
          };
        }
        return ref;
      })
    : [];

  return joinSections([
    buildSystemRole(),
    buildDesignObjective(info, widthPx, heightPx),
    buildDesignReferences(),
    buildLayoutGrid(),
    buildHeroIllustration(),
    buildTypography(),
    buildColorPalette(),
    buildIconography(),
    buildContentBrief(info, normalizedRefs),
    buildSpeakerCards(normalizedRefs),
    buildLogos(normalizedRefs),
    buildQrCode(info),
    buildImageReferencesSection(normalizedRefs),
    buildNegativePrompt(),
    buildQualityRequirements(widthPx, heightPx),
  ]);
}
