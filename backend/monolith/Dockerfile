FROM node:10-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
RUN npm run build
ENV APP_NEW_RELIC_APP_NAME=kuso-app-backend
ENV NEW_RELIC_LICENSE_KEY=
EXPOSE 3000
CMD [ "npm", "run", "start" ]
