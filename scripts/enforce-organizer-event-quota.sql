-- Block new events once an organizer has used every slot on the current pack.
-- Free trial: 1 owned event.
-- Active Pro: events_count on the latest approved organizer_pro_orders row.
-- Editions do not add event slots. A newer approved pack replaces the previous limit.
-- Accounts with no platform subscription (SuperAdmin, legacy) are not capped.

CREATE OR REPLACE FUNCTION enforce_organizer_event_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub record;
  allowed integer;
  owned integer;
  order_events integer;
BEGIN
  SELECT plan_code, status, trial_ends_at, current_period_end
  INTO sub
  FROM organizer_platform_subscriptions
  WHERE organizer_user_id = NEW.user_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF sub.plan_code = 'free' AND sub.status IN ('trial', 'active') THEN
    IF COALESCE(sub.trial_ends_at, sub.current_period_end) IS NOT NULL
       AND COALESCE(sub.trial_ends_at, sub.current_period_end) > NOW() THEN
      allowed := 1;
    ELSE
      RAISE EXCEPTION 'EVENT_QUOTA_EXCEEDED' USING ERRCODE = 'P0001';
    END IF;
  ELSIF sub.plan_code = 'pro' AND sub.status = 'active' THEN
    SELECT events_count
    INTO order_events
    FROM organizer_pro_orders
    WHERE organizer_user_id = NEW.user_id
      AND status = 'approved'
    ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
    LIMIT 1;

    allowed := GREATEST(COALESCE(order_events, 1), 1);
  ELSE
    RAISE EXCEPTION 'EVENT_QUOTA_EXCEEDED' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*)::int
  INTO owned
  FROM events
  WHERE user_id = NEW.user_id;

  IF owned >= allowed THEN
    RAISE EXCEPTION 'EVENT_QUOTA_EXCEEDED' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_organizer_event_quota ON events;
CREATE TRIGGER trg_enforce_organizer_event_quota
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION enforce_organizer_event_quota();
