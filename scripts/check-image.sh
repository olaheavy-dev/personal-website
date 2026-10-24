#!/usr/bin/env bash
# Refuses to publish an image that contains private or secret files, or that
# runs as root (decisions 0003 and 0010). The publish workflow runs this on the
# candidate image before anything is pushed.
#
# Usage: scripts/check-image.sh <image-ref>
set -euo pipefail

image="${1:?usage: scripts/check-image.sh <image-ref>}"

user="$(docker image inspect --format '{{.Config.User}}' "$image")"
if [[ -z "$user" || "$user" == "root" || "$user" == "0" ]]; then
  echo "check-image: $image runs as root; the Dockerfile must switch to a non-root user." >&2
  exit 1
fi

# List every file outside the system directories, then look for anything private.
files="$(docker run --rm --entrypoint sh "$image" -c \
  'find / -xdev \( -path /proc -o -path /sys -o -path /dev -o -path /usr -o -path /lib -o -path /bin -o -path /sbin -o -path /etc -o -path /var -o -path /root -o -path /tmp -o -path /opt -o -path /run \) -prune -o -print 2>/dev/null')"

forbidden="$(printf '%s\n' "$files" | grep -E '/supporting-documents(/|$)|/\.local(/|$)|/\.git(/|$)|/\.env($|\.)|\.pem$|\.key$|/id_(rsa|ed25519)' | grep -Ev '/\.env\.example$' || true)"
if [[ -n "$forbidden" ]]; then
  echo "check-image: $image contains files that must never be published:" >&2
  printf '%s\n' "$forbidden" | head -20 >&2
  exit 1
fi

echo "check-image: $image ok (user: $user, no private files)"
