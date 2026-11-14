-- Speed up participant saved-events lookups (Favorite tab)
CREATE INDEX IF NOT EXISTS idx_participant_saved_events_user
  ON participant_saved_events(user_id);

CREATE INDEX IF NOT EXISTS idx_participant_saved_events_user_event
  ON participant_saved_events(user_id, event_id);
