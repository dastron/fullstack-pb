# Stage 1: Build the Vite React app
FROM node:20 AS react-build

# Set working directory
WORKDIR /app

# Add version as build arg
ARG VERSION
ENV VITE_APP_VERSION=$VERSION

# Install dependencies first for better caching
COPY app/package.json app/yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code and build
COPY app/ .
RUN yarn build

# Stage 2: Build the Node.js functions
FROM node:20 AS functions-build

WORKDIR /functions

# Add version as build arg
ARG VERSION
ENV APP_VERSION=$VERSION

# Install dependencies first
COPY functions/package.json functions/yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy and build functions
COPY functions/ .
RUN yarn build

# Stage 3: Prepare PocketBase
FROM alpine:latest AS pocketbase

# Use VERSION build arg for PocketBase version if provided, otherwise use default
ARG VERSION
ARG PB_VERSION=0.25.5
ARG TARGETARCH

# Use VERSION for PB_VERSION if provided
ENV ACTUAL_PB_VERSION=${PB_VERSION}

RUN apk add --no-cache unzip ca-certificates wget

# Download the appropriate architecture version
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${ACTUAL_PB_VERSION}/pocketbase_${ACTUAL_PB_VERSION}_linux_${TARGETARCH}.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip

# Copy migrations and data (ensure these don't contain any .db-wal/.db-shm files)
COPY ./pb/pb_migrations /pb/pb_migrations
COPY ./pb/pb_data /pb/pb_data
COPY ./pb/pb_hooks /pb/pb_hooks

# Stage 4: Final image
FROM nginx:alpine

# Add version label
ARG VERSION
LABEL version=$VERSION

# Install runtime dependencies
RUN apk add --no-cache --update \
    nodejs \
    supervisor \
    bash

# Copy built assets
COPY --from=react-build /app/dist /usr/share/nginx/html
COPY --from=pocketbase /pb /pb
COPY --from=functions-build /functions /functions

# Copy configurations
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/supervisord.conf /etc/supervisord.conf

# Copy and set up entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose ports (HTTP, PocketBase, Functions)
EXPOSE 80 8080 8081

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]