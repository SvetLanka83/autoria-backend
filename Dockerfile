FROM node:20-alpine

# Maintainer information (optional)
LABEL maintainer="Some Dev"

# Create working directory inside the container
WORKDIR /app

# Copy only package files first to leverage Docker layer caching
COPY ./backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend source code into the container
COPY ./backend ./

# Build the project (remove this line if you don't use TypeScript or a build step)
RUN npm run build

# Expose the port that the application listens on
EXPOSE 3000

# Start the application (adjust if your start script has a different name)
CMD ["npm", "run", "start"]
