-- Documents the scientificCommittee block inside landing_pages.config JSON.
-- No new tables: structured committee data is stored in the existing config column.

COMMENT ON COLUMN landing_pages.config IS
  'ConferenceConfig JSON. Includes scientificCommittee { eventChair, subCommittees[] } '
  'with per-person name, role, establishment, email, bio, linkedin, links (orcid|google_scholar|other); '
  'subCommittees have name, icon, chair, members[]. Legacy committee[] is still read for migration. '
  'Also: eventTopics[], submission.buttons/steps, committee tiers, sections visibility, etc.';
