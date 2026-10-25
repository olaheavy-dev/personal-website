# Next.js standalone server. Built in CI, never on the server (decision 0003).
# Versions: Node 24 (.nvmrc), pinned by digest (Dependabot bumps it), and the pnpm
# version pinned in package.json.

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The commit this image was built from; /healthz reports it.
ARG BUILD_SHA=dev
ENV BUILD_SHA=$BUILD_SHA NEXT_TELEMETRY_DISABLED=1
# The Supabase browser values. Next.js writes NEXT_PUBLIC_* into the build, so they must be
# present here; the runtime stage below does not need them. They are public by design (the
# URL and the publishable key), and the guard refuses a missing or malformed value. Only a
# local smoke build may skip it, with SUPABASE_OPTIONAL=1 (docs/deploy.md).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG SUPABASE_OPTIONAL=0
RUN if [ "$SUPABASE_OPTIONAL" != "1" ]; then node scripts/check-build-env.mjs; fi
RUN pnpm build

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS runtime
WORKDIR /app
ARG BUILD_SHA=dev
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
LABEL org.opencontainers.image.source="https://github.com/olaheavy-dev/personal-website" \
      org.opencontainers.image.description="olaheavy.dev, the personal site of Sunkanmi Olawuwo" \
      org.opencontainers.image.revision=$BUILD_SHA
RUN addgroup -S web && adduser -S web -G web
COPY --from=build --chown=web:web /app/.next/standalone ./
COPY --from=build --chown=web:web /app/.next/static ./.next/static
COPY --from=build --chown=web:web /app/public ./public
USER web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "server.js"]
