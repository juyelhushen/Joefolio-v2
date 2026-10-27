# Releasing Joefolio

Releases use stable Semantic Versioning tags in the form `vMAJOR.MINOR.PATCH`. The release tag
must match the `version` in `package.json` exactly. The initial candidate for the current package
version is `v0.1.0`.

## Prepare a release candidate

1. Finish and review the intended release changes. Confirm the working tree contains only changes
   that belong in the release, then commit those changes to the intended release branch.
2. Update the version deliberately before preparing a different release. For example:

   ```bash
   npm pkg set version=0.1.1
   npm install --package-lock-only
   ```

   Review both `package.json` and `package-lock.json`, commit the version update, and do not use
   `npm version`, which may create a Git tag automatically. Do not change the package's private
   status or publish it to npm.

3. Run all release checks against the exact release commit:

   ```bash
   npm ci
   npm run validate:release-tag -- v0.1.0
   npm run format:check
   npm run lint
   npm run typecheck
   npm test -- --testTimeout 30000
   npm run build
   git diff --check
   ```

   Substitute the intended tag after deliberately updating the package version. The local tag
   validator rejects malformed, prerelease, floating, and package-version-mismatched tags.

4. Review the release commit and verify that the version in `package.json` is the version intended
   for that release.

## Create and push a tag manually

Only run these commands after the intended release commit is present in your local repository and
you have reviewed the release checks above. Create an annotated tag on that commit, then push only
that tag:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

Replace `v0.1.0` consistently with the intended version. Do not create or push tags as part of
ordinary development or before reviewing the release commit.

## What the workflows do

`.github/workflows/ci.yml` handles pull requests targeting `main` and pushes to `main`. Those
events run formatting, lint, typecheck, tests, and the production build. They do not create GitHub
Releases or deploy to Vercel. The root `vercel.json` disables Git-triggered deployments for `main`
while leaving preview deployments for other branches enabled by default.

`.github/workflows/release.yml` is triggered exclusively by pushes of tags matching `v*`. It first
checks the exact tag format and package version. Then it installs dependencies with `npm ci` and
runs formatting, lint, typecheck, tests, and the production build against the tagged commit.
Invalid `v*` tags fail before quality checks or deployment. After successful checks, the workflow
checks out the commit SHA associated with the tag-push event for validation, quality, and
deployment. After validating the version, it verifies the tag still points to that commit before
quality checks and again before draft creation. The deployment job pulls the Vercel production
configuration, builds with the pinned Vercel CLI, and deploys the prebuilt output to production.
It does not check out or deploy the latest `main` commit. Missing Vercel secrets fail the
deployment job; a draft release is not created unless deployment succeeds.

After a successful deployment, the release-creation job verifies the tag exists on the remote and
uses the repository-provided `GITHUB_TOKEN` to create a GitHub Release in **draft** state with
automatically generated notes. Validation, quality, and deployment jobs have read-only contents
permission; only release creation receives `contents: write`. The workflow never publishes the
draft, pushes tags, or creates npm packages. If a release for the tag already exists, a rerun leaves
it unchanged, whether it is still a draft or has already been published.

## Configure Vercel deployment secrets

Before using tag-based production deployment, add these repository Actions secrets in GitHub:
**Settings → Secrets and variables → Actions → New repository secret**. The deployment job uses
the GitHub `production` environment, so you can instead add them as secrets to that environment.
If you use environment-scoped secrets, ensure that the `production` environment exists and is
configured in repository settings.

- `VERCEL_TOKEN`: create a token in your Vercel account settings under **Tokens**. Grant only the
  access needed to deploy the Joefolio project. Store the token as a GitHub secret; do not commit
  it, print it, or put it in a `VITE_` variable.
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`: retrieve these identifiers from the linked Vercel
  project's **Settings → General**. They are also available in the Vercel CLI's local
  `.vercel/project.json` after linking the correct project (`orgId` and `projectId`). Treat them
  as configuration values and store them as GitHub Actions secrets so the deployment job receives
  them consistently.

The workflow checks that all three values are present before invoking Vercel. It uses Vercel CLI
`65.4.0` explicitly; it does not install an unpinned `latest` CLI. Do not copy secret values into
logs, this guide, or committed files.

## Monitor and verify a release

After manually pushing a version tag, open the repository's **Actions** tab and inspect the
corresponding **Release** run. The jobs proceed in order: tag validation, quality checks,
production deployment, then draft release creation. The deployment log prints the Vercel deployment
URL when supplied by the CLI. Visit that URL and the configured production domain to verify the
deployed version. Then open the draft under **Releases**, review the generated notes, tag and target
commit, and publish it manually only after verification.

## Troubleshooting

- **Invalid tag format:** use exactly `vMAJOR.MINOR.PATCH`, with non-negative numeric components
  and no leading zeroes except for `0`. Prerelease suffixes and floating aliases such as `v1` are
  not supported.
- **Tag/package version mismatch:** deliberately update `package.json` and its lockfile version,
  commit that update, and create a new tag that exactly matches the package version. Do not change
  the tag to point at a different version without reviewing and committing the version update.
- **Quality job failed:** inspect the failing formatting, lint, typecheck, test, or build step.
  Correct the source on a new commit, deliberately update the package version, then use a new
  version/tag. The existing tag identifies the earlier commit and should not be moved or reused.
- **Deployment failed:** inspect the failing Vercel CLI step without exposing credentials. Verify
  the three GitHub secrets, that the token is valid and authorized for the project, and that the
  project IDs refer to the intended Vercel project. Fix the issue and release a new version/tag;
  the draft release will not be created before deployment succeeds.
- **Draft creation failed:** inspect the release job's tag verification and `gh release create`
  output. Confirm the tag exists on the remote and that repository Actions permissions allow
  `GITHUB_TOKEN` to write contents. No personal access token or new GitHub secret is required.
- **A release already exists:** the workflow intentionally does not modify it on reruns. Review or
  publish the existing draft in GitHub rather than trying to recreate it.

## Subsequent versions and immutable tags

Use a **patch** increment for backward-compatible fixes (for example `0.1.0` to `0.1.1`), a
**minor** increment for backward-compatible functionality or content changes (for example `0.1.0`
to `0.2.0`), and a **major** increment for incompatible changes or a major release milestone (for
example `0.1.0` to `1.0.0`). Update and commit the package and lockfile version before tagging.

Once a tag or release has been published, never move, delete, or reuse that tag. It is the stable
identifier for a specific commit and generated release record. If a published release needs a
correction, prepare a new patch version and tag instead.
