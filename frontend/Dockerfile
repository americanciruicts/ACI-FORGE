FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Remove existing .next if exists
RUN rm -rf .next

EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]

