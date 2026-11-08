# User avatar

`POST /api/user/v1/me/avatar` — authenticated users of every role may update
their own avatar. No user ID, URL or other metadata is accepted from the client.

Send multipart/form-data containing exactly one file field named `avatar`.
Accepted: JPEG, PNG, WebP, maximum 5 MB. Backend checks the file's content signature
and MIME type; Cloudinary decodes and converts the image to JPEG at 512×512.
SVG, extra fields/files and missing/invalid images are rejected (422); oversize is 413.
Not authenticated is 401; missing Cloudinary config is 503; provider failure is 502.

Successful response uses responseCommon with `data: { avatar_url: "https://..." }`.
Only User.avatar_url changes. No User schema change or client-side secret is required.
Uses existing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET settings.

UI: tutor edit profile, generic `/profile`, and a parent's own public profile.
Users see a preview and explicitly click Save avatar. The AuthProvider updates the
user image and dashboard sidebar immediately. Public tutor cards/profile/chat prefer
the user avatar and fall back to the old tutor profile avatar for historical data.
DB write failure triggers best-effort cleanup of the newly uploaded asset.

Old Cloudinary avatar assets are retained; no automatic deletion of older URLs is performed.
Live Cloudinary upload has not been exercised by the agent.
