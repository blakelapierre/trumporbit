FROM alpine

RUN apk --no-cache add nodejs && rm -rf /tmp/*

ADD ./app /app

CMD node /app/.dist/index.js < tweets
