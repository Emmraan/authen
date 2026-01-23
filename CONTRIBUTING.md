# 🤝 Contributing

> **Thanks for contributing!** This document outlines basic steps and expectations for contributing to the Authen Microservice.

## 🌿 1. Branches and PRs

### 📋 Branch Naming:

- Create a feature branch from `main` named:
    - `feat/<short-description>` for new features
    - `fix/<short-description>` for bug fixes
    - `docs/<short-description>` for documentation changes
    - `refactor/<short-description>` for code restructuring

### 📝 Pull Requests:

- Open pull requests against `main` with a clear description
- Include screenshots (if applicable)
- Link relevant issues if any

## 🎨 2. Code Style

### ✅ Guidelines:

- Follow existing patterns and conventions
- Prefer small, focused commits
- Write clean, readable code
- Add appropriate comments when necessary

### 🔧 Before committing, run linters and formatters:

```bash
pnpm lint && pnpm format:check
```

## 🧪 3. Tests

### 📋 Testing Requirements:

- Add **unit tests** for new logic
- Add **integration tests** when adding new HTTP behavior
- Ensure all tests pass before submitting

### 🏃 Run the test suite locally:

```bash
pnpm test
```

### 📁 Test Structure:

- Integration and unit tests live under `test/`
- Follow existing test patterns and naming conventions

## 🔄 4. CI and Verification

### ⚡ Before opening a PR:

The project has a `pnpm verify` script that runs:

- ✅ Lint
- 📝 Typecheck
- 🧪 Tests
- 🎨 Format check
- 🏗️ Build

### 🏃 Run verification:

```bash
pnpm verify
```

## 🔒 5. Security

### 🛡️ Security Guidelines:

- ❌ **Never commit secrets** (API keys, passwords, tokens)
- 🌐 **Use environment variables** for configuration
- 🔐 **Use CI secret storage** for deployment credentials
- 📋 Review your changes for sensitive data before committing

> ⚠️ **Important:** Always double-check your commits for accidental secret exposure!

## 👀 6. Code Review

### 📋 Review Process:

- 🏷️ **Add relevant reviewers** to your PR
- 💬 **Respond promptly** to code review feedback
- 📝 **Keep changes small** and well-documented
- 🎯 **Address all review comments** before requesting merge

### ✨ Best Practices:

- Provide clear explanations for complex changes
- Include test coverage for new features
- Update documentation when necessary
- Be respectful and constructive in discussions

## 🏷️ 7. Commit Types

Use conventional commit messages with the following types:

### 📋 Commit Type Guidelines:

| Type         | Description         | Example                                  |
| ------------ | ------------------- | ---------------------------------------- |
| **feat**     | ✨ New feature      | `feat: add user registration endpoint`   |
| **fix**      | 🐛 Bug fix          | `fix: resolve token validation error`    |
| **docs**     | 📚 Documentation    | `docs: update API documentation`         |
| **refactor** | ♻️ Code restructure | `refactor: simplify auth service logic`  |
| **style**    | 🎨 Formatting only  | `style: fix code formatting issues`      |
| **test**     | 🧪 Tests            | `test: add unit tests for login service` |
| **chore**    | 🔧 Maintenance      | `chore: update dependencies`             |

### 📝 Commit Message Format:

```
<type>: <description>

[optional body]

[optional footer]
```

### ✅ Examples:

```bash
feat: add user registration endpoint
- Implement email validation
- Add password strength requirements
- Create user repository methods

fix: resolve token validation error
Tokens were not properly validated during refresh flow

refactor: simplify auth service logic
Remove duplicate code and improve error handling
```

---

<div align="center">
  <strong>Thank you for improving the project! 🎉</strong><br>
  Your contributions help make Authen better for everyone.
</div>
