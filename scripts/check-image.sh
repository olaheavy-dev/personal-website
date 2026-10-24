#!/usr/bin/env bash
# Refuses to publish an image that contains private or secret files, or that
# runs as root (decisions 0003 and 0010). The publish workflow runs this on the
# candidate image before anything is pushed.
#
# Usage: scripts/check-image.sh <image-ref>
set -euo pipefail

image="${1:?usage: scripts/check-image.sh <image-ref>}"

user="$(docker image inspect --format '{{.Config.User}}' "$image")"
# USER may be "name", "uid" or "name:group"; only the user part matters.
user_part="${user%%:*}"
if [[ -z "$user_part" || "$user_part" == "root" || "$user_part" == "0" ]]; then
  echo "check-image: $image runs as root; the Dockerfile must switch to a non-root user." >&2
  exit 1
fi

# List every file except kernel filesystems and /usr, then look for anything private by name.
# Names only: private content copied inside a bundle can't be detected this way, which is
# why .dockerignore keeps private material out of the build context in the first place.
# Scan as root in a throwaway container so unreadable folders (such as /root) are seen too.
files="$(docker run --rm --user 0 --entrypoint sh "$image" -c \
  'find / -xdev \( -path /proc -o -path /sys -o -path /dev -o -path /usr \) -prune -o -print')"

forbidden="$(printf '%s\n' "$files" | grep -E '/supporting-documents(/|$)|/\.local(/|$)|/\.git(/|$)|/\.env($|\.)|\.pem$|\.key$|/id_(rsa|ed25519)' | grep -Ev '/\.env\.example$|^/etc/ssl[0-9.]*/cert\.pem$' || true)"
if [[ -n "$forbidden" ]]; then
  echo "check-image: $image contains files that must never be published:" >&2
  printf '%s\n' "$forbidden" | head -20 >&2
  exit 1
fi

echo "check-image: $image ok (user: $user, no private files)"
