#!/usr/bin/env bash
# Used by the CI jobs that run in the Playwright image (visual regression, e2e and accessibility).
# The image ships the browsers for one Playwright version. Ask the installed @playwright/test where
# it expects its browsers (a dry run downloads nothing) and fail if any of those folders is missing
# from the image. That is true exactly when the package and the image tag disagree, for example
# after a Dependabot bump.
set -eu
missing=0
for dir in $(pnpm exec playwright install --dry-run chromium | sed -n 's/^ *Install location: *//p'); do
  if [ ! -d "$dir" ]; then
    echo "::error::Missing $dir. The Playwright image in ci.yml does not match @playwright/test in package.json. Update the image tag and digest to the same version."
    missing=1
  fi
done
exit "$missing"
