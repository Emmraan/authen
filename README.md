# 🔐 Authen

> A compact, production-minded authentication microservice built with NestJS and TypeScript

This repository implements a **Phase‑1 auth service** (signup, login, refresh, logout, me) using JWTs (access + refresh), bcrypt hashing, and an in‑memory storage layer for quick local development. It's designed to be **DB‑adapter friendly** so you can swap in Postgres or another store later.

## ✨ Features

- 🏗️ **NestJS modular architecture**
- 🔑 **Access + refresh JWT tokens**
- 🔒 **bcrypt password hashing** (configurable salt rounds, min 10)
- 💾 **In‑memory repositories** (Phase‑1) — DB‑agnostic design
- ✅ **Validation** with `class-validator`/`class-transformer`
- 🧪 **Well-covered tests** (Jest + SuperTest)
- 🎨 **ESLint + Prettier**, TypeScript typechecking
- 🐳 **Dockerfile and GitHub Actions CI ready**

## 🚀 Prerequisites

- **Node 18+** (LTS recommended)
- **pnpm**
- **Git**

## 🏃 Quick start (local)

1. **Clone the repository:**

```bash
git clone https://github.com/Emmraan/authen.git
```

2. **Navigate to the project directory:**

```bash
cd authen
```

3. **Install dependencies:**

```bash
pnpm install
```

4. **Run in development** (hot reload):

```bash
pnpm dev
```

5. 🎉 **API runs on** `http://localhost:3000` **by default**

## ⚙️ Environment variables

Copy `.env.example` to `.env` and edit values as needed.

### 🔑 Key environment variables:

| Variable                       | Description                  | Example               |
| ------------------------------ | ---------------------------- | --------------------- |
| `PORT`                         | Server port                  | `3000`                |
| `JWT_ACCESS_TOKEN_SECRET`      | Secret for access tokens     | `your-secret-key`     |
| `JWT_REFRESH_TOKEN_SECRET`     | Secret for refresh tokens    | `your-refresh-secret` |
| `JWT_ACCESS_TOKEN_EXPIRES_IN`  | Access token expiration      | `15m`                 |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration     | `7d`                  |
| `BCRYPT_SALT_ROUNDS`           | Password hashing salt rounds | `12`                  |

> 💡 **Note:** The project uses `src/config/config.service.ts` to read env values.

## 📜 Scripts

| Script              | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `pnpm dev`          | Run with `ts-node-dev` (fast dev server)                        |
| `pnpm build`        | Build production JS into `dist/` (uses `tsconfig.build.json`)   |
| `pnpm start`        | Run `nest start` (expects built code)                           |
| `pnpm lint`         | Run ESLint                                                      |
| `pnpm lint:fix`     | Fix lintable issues                                             |
| `pnpm typecheck`    | `tsc -p tsconfig.json --noEmit`                                 |
| `pnpm test`         | Run Jest tests                                                  |
| `pnpm format:check` | Check Prettier formatting                                       |
| `pnpm format:write` | Apply Prettier formatting                                       |
| `pnpm verify`       | Runs lint, typecheck, tests, format check, and build (CI-style) |

## 🧪 Running tests

Unit tests and integration tests use Jest + SuperTest.

```bash
pnpm test
```

### 📝 Notes:

- 📍 E2E/integration specs live under `test/` and are meant for local CI/dev runs
- 🚫 `tsconfig.build.json` intentionally excludes `test/**` (and `src/**/*.spec.ts`) so production builds don't attempt to compile tests

## 🐳 Docker

A simple `Dockerfile` is provided. Build and run:

```bash
docker build -t authen .
docker run -e NODE_ENV=production -p 3000:3000 authen
```

## 🔄 CI

A GitHub Actions workflow is included to run lint, typecheck, tests + coverage, and build. Adjust workflow YAML to match your branch policies.

## 📁 Project structure

```
├── src/
│   ├── modules/          # Nest modules (auth, users, tokens)
│   ├── common/           # Filters, guards, helpers
│   ├── config/           # ConfigService wrapper
│   └── integration/      # E2E tests (moved to test/integration)
├── test/                 # Integration tests and other test-only code
├── jest.config.cjs       # Jest config
├── tsconfig.json         # Main TypeScript config
├── tsconfig.build.json   # Build config (excludes tests)
├── .eslintrc.json        # ESLint config
└── tsconfig.eslint.json  # TypeScript ESLint config
```

## 🗄️ Extending to a real database

The current `InMemory*Repository` implementations live under `src/modules/*`. To swap in Postgres (or another DB):

### 📋 Migration steps:

1. **Implement repository classes** that satisfy the same interfaces
2. **Replace provider bindings** in the corresponding Nest module to use your DB adapter in non-test environments
3. **Add integration tests** that exercise the adapter

## 🔧 Troubleshooting

### ⚠️ ESLint TypeScript version warning:

If you see a warning about unsupported TypeScript versions from `@typescript-eslint/typescript-estree`:

- Option (a): Upgrade `@typescript-eslint` packages to match your TypeScript version (we upgraded them in this repo)
- Option (b): Set `parserOptions.warnOnUnsupportedTypeScriptVersion` to `false` in `.eslintrc.json`

### 🚫 Build issues:

If `pnpm build` fails due to tests importing dev-only packages, ensure `tsconfig.build.json` excludes test files.

## 🤝 Contributing

We welcome contributions to `authen`! If you'd like to contribute, please follow these steps:

### 💎 Guidelines:

- Follow existing code style
- Run `pnpm verify` before committing

### 🔄 Contribution workflow:

1. **Fork** the repository
2. **Create a new branch** (`git checkout -b feature/YourFeature`)
3. **Make your changes and commit them** (`git commit -m 'Add YourFeature'`)
4. **Push to the branch** (`git push origin feature/YourFeature`)
5. **Open a Pull Request**

> ✨ Please ensure your code adheres to the existing style and passes all tests

## 🔒 Security

- 🛡️ **Keep your JWT secrets secure** and rotate them appropriately
- 🌐 **Use environment secrets in CI** rather than storing sensitive values in the repo

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by the Authen team
</div>
