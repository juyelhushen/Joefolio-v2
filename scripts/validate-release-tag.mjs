import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const releaseTag = process.argv[2];

if (!releaseTag) {
  console.error('A release tag is required, for example: v0.1.0.');
  process.exit(1);
}

if (!/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(releaseTag)) {
  console.error(
    `Invalid release tag "${releaseTag}". Use a stable version tag in the form vMAJOR.MINOR.PATCH.`,
  );
  process.exit(1);
}

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const expectedTag = `v${version}`;

if (releaseTag !== expectedTag) {
  console.error(
    `Release tag "${releaseTag}" does not match package.json version "${version}". Expected "${expectedTag}".`,
  );
  process.exit(1);
}

console.log(`Release tag ${releaseTag} matches package.json version ${version}.`);
