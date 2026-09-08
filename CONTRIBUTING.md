# Contributing Guide

## Branch policy

- `main`: stable/production
- `develop`: integration
- `feature/<name>`: new functionality
- `fix/<name>`: bug fixes
- `refactor/<name>`: refactoring
- `docs/<name>`: documentation

Do not push directly to `main` or `develop`.

## Normal workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<your-feature>
```

After coding:

```bash
git add .
git commit -m "feat: describe the change"
git push -u origin feature/<your-feature>
```

Then open a Pull Request into `develop`.

## Commit convention

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring
- `docs:` documentation
- `test:` tests
- `chore:` tooling/configuration
- `style:` formatting
- `perf:` performance

## Backend layering

`Route -> Middleware -> Controller -> Service -> Repository -> Model -> MongoDB`

- Routes: endpoint definitions
- Middleware: authentication, validation, request processing
- Controllers: HTTP request/response
- Services: business logic
- Repositories: database access
- Models: Mongoose schemas

## Frontend layering

`Page -> Components/Hooks -> Services -> API`

## Rules

- Never commit `.env`.
- Never commit passwords, API keys or JWT secrets.
- Keep business logic out of routes/controllers.
- Validate all external input.
- Document new APIs.
- Add tests for important business logic.
- Keep unrelated changes out of a PR.
