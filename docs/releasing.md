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
events run the existing quality checks and do not create GitHub Releases. Automatic Vercel
production deployments from `main` remain controlled by the existing Vercel configuration; these
workflows do not change that configuration or deploy the site.

`.github/workflows/release.yml` is triggered exclusively by pushes of tags matching `v*`. Its
quality job checks the exact tag format and package version, installs dependencies with `npm ci`,
then runs formatting, lint, typecheck, tests, and the production build against the tagged commit.
Invalid `v*` tags fail validation before dependency installation.

Only after every release quality check succeeds does the dependent release-creation job verify the
tag exists on the remote and use the repository-provided `GITHUB_TOKEN` to create a GitHub Release
in **draft** state with automatically generated notes. Only that job receives `contents: write`;
the quality job has read-only contents permission. The workflow never publishes the draft, deploys
the website, pushes tags, or creates npm packages. If a release for the tag already exists, a rerun
leaves it unchanged, whether it is still a draft or has already been published.

Open the draft release on GitHub after the workflow completes. Review the generated notes, title,
tag, target commit, and source archives; edit the notes if needed, then publish the release
manually when approved.

## Troubleshooting

- **Invalid tag format:** use exactly `vMAJOR.MINOR.PATCH`, with non-negative numeric components
  and no leading zeroes except for `0`. Prerelease suffixes and floating aliases such as `v1` are
  not supported.
- **Tag/package version mismatch:** deliberately update `package.json` and its lockfile version,
  commit that update, and create a new tag that exactly matches the package version. Do not change
  the tag to point at a different version without reviewing and committing the version update.
- **Quality job failed:** inspect the failing formatting, lint, typecheck, test, or build step.
  Correct the source on a new commit, then use a new version/tag if the failed tag identifies an
  immutable release candidate.
- **Draft creation failed:** inspect the release job's tag verification and `gh release create`
  output. Confirm the tag exists on the remote and that repository Actions permissions allow
  `GITHUB_TOKEN` to write contents. No personal access token or new secret is required.
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
