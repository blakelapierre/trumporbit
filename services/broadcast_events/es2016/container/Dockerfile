FROM node:slim

RUN apt-get update && apt-get install -y libc6-dev

ADD ./app /app

RUN cd /app && npm install uws

CMD node /app/.dist/index.js < tweets
