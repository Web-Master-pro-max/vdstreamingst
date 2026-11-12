FROM node:18-alpine

WORKDIR /app

# Install system dependencies: openssl for Prisma, python3 + ffmpeg for video transcoding, netcat
RUN apk add --no-cache openssl python3 py3-pip ffmpeg netcat-openbsd

COPY package*.json ./

RUN npm install

# Install Python requirements for transcoder helper
RUN pip install --no-cache-dir boto3 redis requests python-dotenv --break-system-packages

COPY . .

# Pre-generate Prisma Client during build
RUN npx prisma generate

# Expose backend port
EXPOSE 8000

# Start script running migrations and seeding on boot
CMD ["npm", "run", "start:prod"]
