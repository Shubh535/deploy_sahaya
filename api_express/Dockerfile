# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from parent directory
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy api_express source code
COPY api_express/ ./api_express/

# Set working directory to api_express
WORKDIR /app/api_express

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the backend
CMD ["node", "index.js"]