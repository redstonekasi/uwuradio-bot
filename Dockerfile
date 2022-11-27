FROM node:19.1-alpine

RUN apk add --no-cache ffmpeg
RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i

COPY . .
RUN pnpm build

CMD [ "pnpm", "start" ]
