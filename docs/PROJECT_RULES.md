# Project Rules

1. One repository for the whole team.
2. No direct pushes to protected branches.
3. Every feature gets its own branch.
4. Every feature enters `develop` through a Pull Request.
5. `main` is only for stable releases.
6. `.env` files are local and never committed.
7. `.env.example` contains safe placeholders/default development values.
8. MongoDB database changes must be documented.
9. API response format must remain consistent.
10. Business logic belongs in services.
11. Database access belongs in repositories.
12. Every new endpoint must be documented.
13. Run lint/test/build before requesting review.
