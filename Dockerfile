# Dockerfile

FROM node:20.15-alpine3.19
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY src/package.json src/package-lock.json ./
RUN npm install
RUN npm install -g nodemon
COPY src/ .
EXPOSE 3000
CMD [ "nodemon", "start"]