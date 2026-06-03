FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma client
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

# Expose port
EXPOSE 5000

# Start script running migrations and seeding on boot
CMD ["npm", "run", "start:prod"]
