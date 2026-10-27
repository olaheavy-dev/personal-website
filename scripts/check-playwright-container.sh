#!/usr/bin/env bash
# Used by the CI jobs that run in the Playwright image (visual regression, e2e and accessibility,
# and the post-deploy smoke run). The image ships the browsers for one Playwright version. Ask the
# installed @playwright/test where it expects its browsers (a dry run downloads nothing) and fail
# if any of those folders is missing from the image. That is true exactly when the package and the
# image tag disagree, for example after a Dependabot bump.
set -eu

output=$(pnpm exec playwright install --dry-run chromium)
dirs=$(printf '%s\n' "$output" | sed -n 's/^ *Install location: *//p')
if [ -z "$dirs" ]; then
  echo "::error::The Playwright dry run printed no 'Install location' line, so the browser folders cannot be checked. Its output format may have changed."
  printf '%s\n' "$output"
  exit 1
fi

missing=0
for dir in $dirs; do
  if [ ! -d "$dir" ]; then
    echo "::error::Missing $dir. The Playwright image in the workflow files does not match @playwright/test in package.json. Update the image tag and digest to the same version, in all three places."
    missing=1
  fi
done
exit "$missing"
