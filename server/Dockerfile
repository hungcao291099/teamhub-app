
# Use Node.js 18 on Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Start form dist/index.js
CMD ["node", "dist/index.js"]
