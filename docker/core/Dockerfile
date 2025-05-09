# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.11.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for installing production dependencies.
FROM base AS deps

# Install pnpm globally
RUN npm install -g pnpm

COPY package*.json ./

# Bundle app source inside Docker image
COPY . .

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.pnpm-store to speed up subsequent builds.
# Leverage bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Copy the rest of the source files into the image.
COPY . .

# Set working directory to client and run the build script using exec form.
WORKDIR /usr/src/app/client
CMD ["pnpm", "run", "build"]

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM node:${NODE_VERSION}-alpine AS final

# Use production node environment by default.
ENV NODE_ENV=production

# Run the application as a non-root user.
USER node

# Set working directory.
WORKDIR /usr/src/app/client

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/client/.next ./client/.next

# Expose the port that the application listens on.
EXPOSE 7008

# Run the application.
CMD ["pnpm", "start"]