FROM node:20-slim

# Install Typst
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://typst.community/typst-install/install.sh | sh \
    && mv /root/.local/bin/typst /usr/local/bin/typst \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
