-- Landing page Call-for-Papers / CTA fields live inside landing_pages.config (JSON text).
-- Apply in Supabase SQL Editor (same project as your Supabase MCP server).
-- Non-breaking: only documents JSON shape; app keeps JSON.stringify/parse for config.

COMMENT ON COLUMN landing_pages.config IS 'ConferenceConfig JSON. submission.buttons: actionTarget (document|link|image|form); document/image support assetSource (url|upload), url, uploadedFileUrl; form uses formId. submission.steps: title, description, deadline ISO, icon, optional legacy date.';
