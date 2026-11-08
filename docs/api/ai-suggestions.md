# Tutor suggestions — profile categories

Canonical base URL: `/api/suggestions/v1`.
The previous `/api/ai-suggestions/v1` prefix remains a route alias and returns
the same NEW response described below; it does not retain the old post-based payload.

## Routes

- GET `/requests/:requestId?page=1&limit=10`: current recommendations.
- POST `/requests/:requestId/refresh`: empty JSON body, recomputes page 1.

Every endpoint requires authentication and PARENT authorization. Only the Parent's
own OPEN, unexpired request is accepted. Invalid ID, absent or other-owned request:
404. Closed/expired: 409. Invalid query/body: 422. GET page defaults to 1,
limit defaults to 10, maximum 100.

## Matching rules

1. Read the owned request's subject_name and grade_level.
2. Resolve those names against active SUBJECTS and GRADE_LEVELS.
3. Tutor must have a complete profile and both category references in
   teaching_categories: one type subjects and one type grades.
4. The tutor account must have role TUTOR and account_status ACTIVE.
5. Matching uses exact normalized names (Vietnamese accents/case ignored). IELTS,
   TOEIC and other named levels work without interpreting their numbers as class grades.
6. Sort by average_rating descending, then full_name and profile ID for stable ties.
   Paginate all matches; there is no top-10 truncation before pagination.
7. Tutors marked NOT_AVAILABLE retain the existing warning badge.

No published post is required. Price, mode and schedule are not used as matching
criteria or inferred from the profile. A selection of multiple subjects and levels
means the profile supports each selected subject and each selected level; no
subject-level pairing is stored by this feature.

There is no AI provider, match percentage, AI quota use or credit deduction for
viewing/refreshing suggestions. Sending an invitation still uses the existing credit rules.
The old AI_SUGGESTIONS cache is neither read nor written. Every load reflects current
profile selections, category activity and account status. Existing cache records
and the old model are retained without migrating/deleting stored data.

## Response data

Uses the existing responseCommon envelope:

```json
{
  "request": { "_id": "...", "title": "...", "subject_name": "Toán", "grade_level": "Lớp 9", "teaching_mode": "ONLINE", "budget": 200000 },
  "items": [{
    "_id": "profile-id",
    "tutor": { "profile_id": "profile-id", "full_name": "Tutor", "avatar_url": null, "headline": "...", "average_rating": 4.9, "availability_status": "AVAILABLE" },
    "matching_categories": [
      { "type": "subjects", "category_id": "...", "name": "Toán" },
      { "type": "grades", "category_id": "...", "name": "Lớp 9" }
    ],
    "reason": "Phù hợp môn Toán và trình độ Lớp 9."
  }],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 },
  "hint": null
}
```

`post`, `ai_reason`, `ai_status` and `cached_until` are no longer response fields.
Public tutor text uses the existing contact masker. Each tutor appears once.

## Frontend

- Canonical page: `/parent/suggestions`.
- Request-specific: `/parent/requests/:requestId/suggestions`.
- Old AI-prefixed page URLs redirect to the corresponding canonical page.
- Sidebar, request actions and homepage copy now say "Gợi ý gia sư".
- Cards display the matching profile categories, reason and public-profile link.
- Existing request-specific invitation dialog remains unchanged.
- Legacy source filenames and CSS class names remain to avoid unrelated renames.
