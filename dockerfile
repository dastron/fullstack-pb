###################################################
# Stage 1: Base environment with Yarn 4
###################################################
FROM node:22-alpine AS base
WORKDIR /repo

# Enable Corepack & yarn 4.7
# RUN corepack enable && corepack prepare yarn@4.7.0 --activate

###################################################
# Stage 2: Dependencies
###################################################
FROM base AS deps

# 1) Copy only the files required to install dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

COPY app/package.json app/
COPY functions/package.json functions/
COPY shared/package.json shared/

# 2) Install dependencies (immutable = no lockfile updates)
RUN yarn install --immutable

###################################################
# Stage 3: Builder
###################################################
FROM deps AS builder

# 1) Copy full monorepo source
COPY app app
COPY functions functions
COPY shared shared

# 2) Build in topological order (shared -> functions -> app)
RUN yarn build

###################################################
# Stage 4: PocketBase
###################################################
FROM alpine:latest AS pocketbase

ARG PB_VERSION=0.25.5
ARG TARGETARCH
ENV ACTUAL_PB_VERSION=${PB_VERSION}

RUN apk add --no-cache unzip ca-certificates wget \
  && wget -q https://github.com/pocketbase/pocketbase/releases/download/v${ACTUAL_PB_VERSION}/pocketbase_${ACTUAL_PB_VERSION}_linux_${TARGETARCH}.zip -O /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb/ \
  && rm /tmp/pb.zip

COPY pb/pb_migrations /pb/pb_migrations
COPY pb/pb_data       /pb/pb_data
COPY pb/pb_hooks      /pb/pb_hooks


###################################################
# Stage 5: Final runtime image
###################################################
FROM node:22-alpine
ARG VERSION
LABEL version=$VERSION
ENV NODE_ENV=production

# Install NGINX + Supervisor for process management
RUN apk add --no-cache --update nginx supervisor bash

# Enable Corepack & yarn 4.7
# RUN corepack enable && corepack prepare yarn@4.7.0 --activate

# 1) Copy PocketBase from its build stage
COPY --from=pocketbase /pb /pb

# 2) Set up project workspace
WORKDIR /workspace
COPY --from=deps /repo/package.json     ./
COPY --from=deps /repo/yarn.lock       ./
COPY --from=deps /repo/.yarnrc.yml     ./
COPY --from=deps /repo/.yarn           .yarn

# 3) Copy built packages from builder
COPY --from=builder /repo/app/package.json      app/
COPY --from=builder /repo/app/dist              app/dist
COPY --from=builder /repo/functions/package.json  functions/
COPY --from=builder /repo/functions/dist          functions/dist
COPY --from=builder /repo/shared/package.json   shared/
COPY --from=builder /repo/shared/dist           shared/dist

# 4) Install production-only dependencies for the entire monorepo
RUN yarn workspaces focus --production --all

# 5) Copy built app output to Nginx’s default location
COPY --from=builder /repo/app/dist /usr/share/nginx/html

# 6) Nginx & Supervisor config and entrypoint
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/supervisord.conf /etc/supervisord.conf
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 8080 8081
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
