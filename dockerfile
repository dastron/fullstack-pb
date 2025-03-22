# ---------------------------------------------------------
# Stage 1: Install all dependencies (monorepo root)
# ---------------------------------------------------------
    FROM node:20 AS deps

    # Create a working directory
    WORKDIR /repo
    
    # Copy the top-level package.json and yarn.lock (which define all workspaces)
    COPY package.json yarn.lock ./
    
    # Copy all workspace folders so Yarn can see them and link local packages
    COPY app/ app/
    COPY functions/ functions/
    COPY types/ types/  
    
    # Install dependencies for the parent monorepo
    RUN yarn install --frozen-lockfile
    
    # ---------------------------------------------------------
    # Stage 2: Build the React app
    # ---------------------------------------------------------
    FROM node:20 AS react-build
    
    # Copy everything from the 'deps' stage (including node_modules)
    COPY --from=deps /repo /repo
    WORKDIR /repo
    
    # Build the React app
    WORKDIR /repo/app
    RUN yarn build
    
    # ---------------------------------------------------------
    # Stage 3: Build the Node.js functions
    # ---------------------------------------------------------
    FROM node:20 AS functions-build
    
    # Copy the entire repo (including node_modules) from deps again
    COPY --from=deps /repo /repo
    WORKDIR /repo
    
    # Build the functions
    WORKDIR /repo/functions
    RUN yarn build
    
    # ---------------------------------------------------------
    # Stage 4: Prepare PocketBase
    # (Same as your existing stage)
    # ---------------------------------------------------------
    FROM alpine:latest AS pocketbase
    
    # ... your PocketBase steps ...
    # (unchanged from your example)
    ARG VERSION
    ARG PB_VERSION=0.25.5
    ARG TARGETARCH
    ENV ACTUAL_PB_VERSION=${PB_VERSION}
    
    RUN apk add --no-cache unzip ca-certificates wget
    RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${ACTUAL_PB_VERSION}/pocketbase_${ACTUAL_PB_VERSION}_linux_${TARGETARCH}.zip -O /tmp/pb.zip && \
        unzip /tmp/pb.zip -d /pb/ && \
        rm /tmp/pb.zip
    
    COPY ./pb/pb_migrations /pb/pb_migrations
    COPY ./pb/pb_data /pb/pb_data
    COPY ./pb/pb_hooks /pb/pb_hooks
    
    # ---------------------------------------------------------
    # Stage 5: Final image
    # ---------------------------------------------------------
    FROM nginx:alpine
    ARG VERSION
    LABEL version=$VERSION
    
    # Install runtime dependencies
    RUN apk add --no-cache --update \
        nodejs \
        supervisor \
        bash
    
    # Copy built React assets from react-build stage
    COPY --from=react-build /repo/app/dist /usr/share/nginx/html
    
    # Copy built PocketBase from pocketbase stage
    COPY --from=pocketbase /pb /pb
    
    # Copy built functions from functions-build stage
    COPY --from=functions-build /repo/functions /functions
    
    # Copy your configs & entrypoint
    COPY config/nginx.conf /etc/nginx/nginx.conf
    COPY config/supervisord.conf /etc/supervisord.conf
    COPY entrypoint.sh /usr/local/bin/
    RUN chmod +x /usr/local/bin/entrypoint.sh
    
    # Expose ports
    EXPOSE 80 8080 8081
    
    ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
    CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
    