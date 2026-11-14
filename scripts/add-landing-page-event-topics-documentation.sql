-- Event Topics live inside landing_pages.config (ConferenceConfig JSON) as eventTopics[].
-- Each item: { id, name, icon, shortDescription, longDescription }.
-- No new table or bucket required; published pages read the same config column.

COMMENT ON COLUMN landing_pages.config IS
  'ConferenceConfig JSON. Includes eventTopics[] (name, icon, shortDescription, longDescription), '
  'submission.buttons/steps, committee tiers, sections visibility, etc.';
