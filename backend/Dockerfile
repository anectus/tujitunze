# Debian-based (not alpine): bcrypt's native binding has no musl
# prebuilt, so alpine would need a full build toolchain just to
# `npm install` it — slim ships glibc, which bcrypt has a prebuilt for.
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3012

CMD ["npm", "run", "start:dev"]
