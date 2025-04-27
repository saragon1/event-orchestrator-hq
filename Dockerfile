FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Detect architecture and build accordingly
RUN if [ "$(uname -m)" = "x86_64" ]; then \
      echo "Building on x86_64 architecture" && \
      npm run build; \
    elif [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then \
      echo "Building on ARM64 architecture - using alternative build" && \
      npm install -D @vitejs/plugin-react && \
      mv vite.config.arm.ts vite.config.ts && \
      npm run build; \
    else \
      echo "Building on ARM architecture - using alternative build" && \
      npm install -D @vitejs/plugin-react && \
      mv vite.config.arm.ts vite.config.ts && \
      npm run build; \
    fi

# Create a custom env-config.js for container usage
RUN echo 'window._env_ = {};' > ./dist/env-config.js

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add runtime environment variable handling via script
WORKDIR /usr/share/nginx/html
COPY env.sh .
RUN chmod +x env.sh

# Make sure the .js files have proper permissions
RUN find /usr/share/nginx/html -type f -name "*.js" -exec chmod 644 {} \;

# Start script that initializes environment variables and starts nginx
CMD ["/bin/sh", "-c", "./env.sh && nginx -g \"daemon off;\""] 