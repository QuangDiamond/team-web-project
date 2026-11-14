# Class Material API (`/api/classroom/v1`)

## POST `/:classId/materials`

Uploads a file to Cloudinary and creates a `CLASS_MATERIALS` record. Requires authentication and role `TUTOR`. The tutor must own the classroom, the classroom must be active, and a non-empty `topic_id` must refer to a topic embedded in that classroom.

Content type: `multipart/form-data`.

Fields:

- `topic_id`: embedded topic ID, or an empty value when the material is not assigned to a topic.
- `title`: required, trimmed, up to 200 characters.
- `material_type`: `DOCUMENT`, `SLIDE`, `VIDEO`, or `LINK`.
- `visibility`: required; `ALL_MEMBERS` or `STUDENTS_ONLY`.
- For `DOCUMENT`, `SLIDE`, or `VIDEO`, `file` is required; maximum 20 MB. Allowed extensions: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.jpg`, `.png`, `.mp4`, `.zip`.
- For `LINK`, send `file_url` containing a valid URL and omit `file`. The backend saves that URL directly and stores `file_size: null`; no Cloudinary upload occurs.

The backend sets `class_id` from the route and `uploader_profile_id` from the authenticated tutor profile. For files, `file_url` / `file_size` come from Cloudinary; for links, `file_url` is the submitted URL and `file_size` is `null`. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend environment.

Successful response (`201`) returns the created material record. Status codes: `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom/topic not found, `409` tutor profile missing or classroom archived, `413` file exceeds 20 MB, `422` invalid fields or file type, `502` Cloudinary upload failed, `503` Cloudinary configuration missing.

## GET `/:classId/materials`

Returns a paginated list of material records. The owner tutor uses the same ownership and active-class checks as above. A student must be an ACTIVE member of the class; a parent must have an ACCEPTED linked child who is an ACTIVE member, and only sees materials with `visibility = ALL_MEMBERS`. Others get 403. Query: `page` (default `1`) and `limit` (default `10`, maximum `100`). Response data contains `items` and `pagination`.

## PATCH `/:classId/materials/:materialId`

Replaces the material file or link and updates its topic, title, material type, and visibility. Uses `multipart/form-data` and the same conditional fields as POST. When replacing with a file, the previous Cloudinary file is removed after the DB update. When replacing with a link, the URL is stored directly and `file_size` becomes `null`. The response includes `old_file_deleted` so the client can detect Cloudinary cleanup failure.

## DELETE `/:classId/materials/:materialId`

Deletes the material record and removes its references from embedded `ASSIGNMENTS.attachments` in the same MongoDB transaction. After the transaction commits, the service attempts to delete the Cloudinary file. The response includes the number of assignments updated and `cloudinary_deleted`; if Cloudinary cleanup fails, the DB deletion remains committed and that flag is `false`.
