FROM alpine

RUN apk --no-cache add nodejs libc6-compat wget && rm -rf /tmp/*

ADD ./app /app

CMD node /app/.dist/index.js < tweets
