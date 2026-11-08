# SC05 — Public tutor search

`GET /api/discovery/v1/tutors` is public. No authentication is required.

Query parameters:

| Parameter | Meaning |
| --- | --- |
| page / limit | Defaults 1 / 10, limit at most 100 |
| q | Name, headline, published post title or subject; literal case-insensitive search, max 100 characters |
| subject / grade | Exact case-insensitive catalog name in a published post's subject / education level, max 100 characters |
| mode | ONLINE, OFFLINE, HYBRID |
| area | Literal substring in the public profile address; hidden addresses never match |
| min_price / max_price | Price per session, 0–1,000,000,000; minimum cannot exceed maximum |
| min_rating | Minimum average rating, 0–5 |
| availability | AVAILABLE or NOT_AVAILABLE |

Only ACTIVE TUTOR accounts with complete profiles are listed, ordered by rating descending
and profile ID ascending. Post filters must match the same PUBLISHED post. The displayed
subjects and minimum price come from matching published posts when post filters are used.

Response uses the existing `responseCommon` envelope:

```json
{
  "success": 1,
  "message": "Get tutors successfully",
  "data": {
    "items": [{
      "profile_id": "...", "full_name": "...", "avatar_url": null,
      "headline": "...", "average_rating": 4.5,
      "availability_status": "AVAILABLE", "subjects": ["Toán"], "min_price": 200000
    }],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

Invalid filters return 422. No email, phone number, private address or account ID is
returned. Public text is passed through the existing contact masking helper.
The previous Parent-only `/api/invitations/v1/tutors` endpoint remains compatible.
Sending invitations still requires authenticated PARENT access and existing credit rules.

## Frontend flow

- Homepage search and navigation open `/tutors`; filters and pagination are in the URL.
- Tutor cards link to `/tutors/:profileId`.
- Guests clicking Invite go to Login; other non-Parent roles receive an explanatory message.
- Parents reuse `InviteTutorDialog` → select an OPEN request → existing invitation API.
- `/parent/invitations` now shows sent invitations with a link to public tutor discovery.

This change does not implement UC06 saved searches/alerts or additional sort modes.
