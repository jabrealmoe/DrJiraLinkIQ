# DrJiraLinkIQ

A Jira Cloud app built with Atlassian Forge to provide intelligent issue linking via a custom JQL function.

## Local Dev Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Lint Code:
   ```bash
   npm run lint
   ```
3. Test Code:
   ```bash
   npm test
   ```
4. Start the Forge local tunnel:
   ```bash
   forge tunnel
   ```

## Environments & Deploy Commands

The app has three environments: `development`, `staging`, and `production`.

To deploy via CLI to a specific environment, use the following commands:

- **Development**:
  ```bash
  forge deploy -e development
  ```
- **Staging**:
  ```bash
  forge deploy -e staging
  ```
- **Production**:
  ```bash
  forge deploy -e production
  ```

## Branching Strategy

This project follows a trunk-based development workflow mapping directly to Forge environments:

| Branch    | Forge Environment |
| --------- | ----------------- |
| `main`    | `production`      |
| `staging` | `staging`         |
| `develop` | `development`     |

### Branch Rules & Protection

- **No direct commits** to `main` or `staging`.
- Feature, fix, and chore branches are cut from `develop` (e.g., `feature/...`, `fix/...`, `chore/...`).
- Code is integrated back into `develop` via Pull Requests.
- The `develop` branch is merged into `staging` via Pull Request.
- Finally, the `staging` branch is merged into `main` (for official releases) via Pull Request.

**Branch Protection configuration (GitHub Settings)**:
- Require Pull Request reviews before merging onto `develop`, `staging`, and `main`.
- Require status checks to pass before merging (e.g., linting, tests, build).

## GitHub Variables & Secrets

The CI/CD pipelines require the following Secrets to automate the Forge CLI interactions safely:

- `FORGE_EMAIL`: Atlassian account email to authenticate the Forge CLI.
- `FORGE_API_TOKEN`: Atlassian API token to authenticate the Forge CLI.
- `FORGE_DEV_SITE`: Site URL for development installs (e.g., `jabrealmoe.atlassian.net`).
- `FORGE_STAGING_SITE`: Site URL for staging installs.
- `FORGE_PROD_SITE`: Site URL for production installs.
