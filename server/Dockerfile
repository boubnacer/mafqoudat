FROM node:22-slim

# Install system build dependencies for native modules (sharp, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend dependencies definition
COPY package*.json .npmrc* ./

# Install production dependencies
RUN npm install --omit=dev --no-audit

# Copy backend application source code
COPY . ./

# Port configured for Railway
ENV PORT=10000
EXPOSE 10000

# Start server
CMD ["node", "server.js"]
