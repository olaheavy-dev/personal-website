# Third-party documentation

Before using a package's API, read the official documentation for the **pinned** version below, not memory. Adding a package or changing a major version updates this file in the same pull request (decision 0012).

| Package / tool                                | Pinned                     | Official documentation                                                                    |
| --------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| Node.js                                       | 24 (`.nvmrc`)              | https://nodejs.org/docs/latest-v24.x/api/                                                 |
| pnpm                                          | 11.28.2 (`packageManager`) | https://pnpm.io/motivation                                                                |
| Next.js                                       | 16.4.3                     | Bundled: `node_modules/next/dist/docs/` (read this first); https://nextjs.org/docs        |
| React / React DOM                             | 19.3.0                     | https://react.dev/reference/react                                                         |
| TypeScript                                    | 5.9.3                      | https://www.typescriptlang.org/docs/                                                      |
| Tailwind CSS                                  | 4.3.3                      | https://tailwindcss.com/docs                                                              |
| ESLint + eslint-config-next                   | 9.39.5 / 16.4.3            | https://eslint.org/docs/latest/ · https://nextjs.org/docs/app/api-reference/config/eslint |
| Prettier + Tailwind plugin                    | 3.9.10 / 0.8.1             | https://prettier.io/docs/ · https://github.com/tailwindlabs/prettier-plugin-tailwindcss   |
| Vitest + coverage-v8                          | 5.0.5                      | https://vitest.dev/guide/                                                                 |
| Testing Library (React, jest-dom, user-event) | 16.3.3 / 7.0.1 / 14.6.8    | https://testing-library.com/docs/react-testing-library/intro/                             |
| jsdom                                         | 30.1.3                     | https://github.com/jsdom/jsdom                                                            |
| Playwright                                    | 1.64.1                     | https://playwright.dev/docs/intro                                                         |
| axe-core for Playwright                       | 4.14.0                     | https://playwright.dev/docs/accessibility-testing                                         |

## GitHub Actions (pinned by commit SHA)

| Action                           | Version                  |
| -------------------------------- | ------------------------ |
| actions/checkout                 | v7.0.1                   |
| actions/setup-node               | v7.1.0                   |
| pnpm/action-setup                | v6.1.0                   |
| actions/upload-artifact          | v7.0.2                   |
| actions/dependency-review-action | v5.0.0                   |
| zizmorcore/zizmor-action         | v0.8.0 (zizmor 1.31.1)   |
| rhysd/actionlint (Docker image)  | 1.7.12, pinned by digest |
