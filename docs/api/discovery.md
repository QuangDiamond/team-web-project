# UC07 — View Public Profile

Base URL: `/api/discovery/v1`. Responses use the existing envelope
`{ success: 1, message: string, data: object }`.

## GET /tutors/:profileId

Public; no authentication required. `profileId` is a TutorProfile ID, not a User ID.
The tutor must have `is_complete: true` and an ACTIVE TUTOR account.
A direct profile view may have zero published posts.

The exact `data` fields are:

```text
profile: {
  _id, user_id, full_name, avatar_url, cover_url, headline, bio, address,
  availability_status, average_rating, experiences, educations, achievements, teaching_categories
}
posts: { items: [{ _id, title, subject_name, grade_level, teaching_mode,
                   price, schedule, description }], pagination }
reviews: { items: [{ _id, rating, comment, tutor_reply, created_at }], pagination }
```

Nested allowlists:

- `experiences`: `{ title, company, start_date, end_date }`
- `educations`: `{ school, degree, graduation_year, description }`
- `achievements`: `{ title, description }`
- `teaching_categories`: `{ type, category_id, name }`, empty for old profiles. Saved tutor selections render as public tags; names use contact masking.

IDs are strings. `price` is a number or null. Dates serialize as ISO timestamps or
null. Avatar uses the current User avatar, falling back to the old tutor profile avatar;
cover uses the profile cover. `address` is null when `is_address_hidden` is true.
Email and phone fields are never returned, regardless of that flag.
Only PUBLISHED posts and APPROVED reviews are returned, newest first, with `_id`
descending as a tie breaker. Review author IDs, contacts and agreement IDs are excluded.

## GET /parents/:userId

Requires the existing authentication middleware (Bearer token or auth cookie),
then `authorize('TUTOR', 'PARENT', 'ADMIN')`. Missing/invalid authentication returns
401; a disallowed caller role returns 403. The target must be an ACTIVE PARENT.

The exact `data` fields are:

```text
profile: { user_id, full_name, avatar_url }
requests: { items: [{ _id, title, subject_name, grade_level, teaching_mode,
                      budget, schedule, description, location_address }], pagination }
```

`budget` is a number or null. Requests must be OPEN and created on or after
`getRequestCutoff()` (currently `REQUEST_LIFETIME_DAYS = 30`). The count and page
use the same filter. Results are newest first, with `_id` descending as a tie breaker.
No student IDs, populated child records, child profile fields, attachments or
parent account details are returned.

## Pagination and errors

Both endpoints accept `?page=1&limit=10` using the existing `getPagination` rules:
default page 1, default limit 10, maximum limit 100. Invalid/nonpositive values
fall back to defaults; the helper parses integer prefixes. Tutor posts and reviews
share the same page and limit, with independent counts and totalPages.

Every pagination object is `{ page, limit, total, totalPages }`. Empty results
have `items: []` and `totalPages: 0`; an out-of-range page returns an empty list.

Malformed/missing target IDs, absent profiles/accounts, incomplete tutor profiles,
inactive targets and wrong target roles return 404 with message
`This profile is not available` through the shared error middleware.

## Privacy and scope

All returned free text, including names, tutor history, post fields, reviews and
request locations, replaces conventional email addresses, phone numbers and links
with `***`. Explicit image URL fields remain URLs for rendering. Model objects and
nested objects are never returned wholesale.

Pattern matching does not identify deliberately obfuscated contact information or
arbitrary names/child details typed into descriptions; moderation remains necessary.
Structured child PII is excluded by the response allowlist.
The current schema only has `is_address_hidden`; no whole-profile visibility flag
is added or inferred. This endpoint does not add search, UC10 Q&A, or new Invite/Apply
actions. Existing Invite/Apply endpoints remain the action paths.

For navigation to `/parents/:userId`, the existing tutor-request DTO and received
invitation DTO now additionally include top-level `parent_user_id` as a string
(null for legacy records without that reference). Invitation DTOs use
`invitation.parent_user_id`, including when the linked request is unavailable.
All their previous fields remain unchanged. Frontend profile routes are
`/tutors/:profileId` and `/parents/:userId`.

## Frontend flow

- `/tutors/:profileId` is public; `/parents/:userId` requires authentication.
  Profile links originate from Home featured tutors, AI suggestions (tutor name
  or post title), application review, sent/received invitations and tutor request
  detail. Tutors can use **View as others** on their own profile.
- A parent selects **Invite**, chooses one of their own OPEN requests from a
  paginated picker, then uses the existing `InviteModal` (1 credit). A tutor can
  apply to a parent's OPEN request using the existing `ApplyModal`.
- Guests receive a login/register prompt. `sessionStorage` stores a safe,
  profile-only return path for the authentication roundtrip, including OAuth
  via `/dashboard`; that return path is cleared when an authenticated profile
  mounts.
- Tutor posts and reviews share the same page/limit query as documented above.
  There is no Q&A or new schema.
