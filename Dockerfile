FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add runtime environment variable handling via script
WORKDIR /usr/share/nginx/html
COPY env.sh .
RUN chmod +x env.sh

# Start script that initializes environment variables and starts nginx
CMD ["/bin/sh", "-c", "./env.sh && nginx -g \"daemon off;\""] 