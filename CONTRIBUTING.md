# Contributing

Thanks for contributing! This document outlines basic steps and expectations for contributing to the Auth Microservice.

1. Branches and PRs

- Create a feature branch from `main` named `feat/<short-description>` or `fix/<short-description>`.
- Open pull requests against `main` with a clear description and screenshots (if applicable).

2. Code style

- Follow existing patterns and prefer small, focused commits.
- Run linters and formatters before committing:

```bash
pnpm lint && pnpm format:check
```

3. Tests

- Add unit tests for new logic and integration tests when adding new HTTP behavior.
- Run the test suite locally:

```bash
pnpm test
```

Integration and unit tests live under `test/`

4. CI and verification

- The project has a `pnpm verify` script that runs lint, typecheck, tests, format check, and build. Run this before opening a PR:

```bash
pnpm verify
```

5. Security

- Never commit secrets. Use environment variables and CI secret storage.

6. Review

- Add reviewers and respond to code review feedback. Keep changes small and well-documented.

Thank you for improving the project!
