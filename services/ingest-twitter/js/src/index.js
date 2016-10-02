import fs from 'fs';
import https from 'https';

import _ from 'lodash';
import Twit from 'twit';
import TwitterStream from 'twitter-stream-api';
import promise from 'promise-callback';
import through2 from 'through2';

const {
  consumer_key,
  consumer_secret,
  access_token,
  access_token_secret
} = process.env;

const T = new Twit({
  consumer_key,
  consumer_secret,
  access_token,
  access_token_secret
});

// const follow = [
//   'HillaryClinton',
//   'tedcruz',
//   'BernieSanders'//,
//   // 'JebBush',
//   // 'RealBenCarson',
//   // 'marcorubio',
//   // 'RandPaul',
//   // 'LindseyGrahamSC',
//   // 'GovMikeHuckabee',
//   // 'MartinOMalley',
//   // 'CarlyFiorina',
//   // 'RickPerry',
//   // 'RickSantorum',
//   // 'bobbyjindal',
//   // 'GovernorPataki',
//   // 'MarkForAmerica',
//   // 'realDonaldTrump',
//   // 'LincolnChafee',
//   // 'PresSherman',
//   // 'JimWebbUSA',
//   // 'ChrisChristie',
//   // 'gov_gilmore',
//   // 'ScottWalker',
//   // 'JohnKasich'
// ].map(name => name).join(', ');

const following = follow(['25073877', '1339835893']);

function follow(ids) {
  // const following = statuses(ids.join(','));
  const following = f(ids);

  return { nowFollow };

  function nowFollow(ids) {

  }

  function f(ids) {
    const T = new TwitterStream({consumer_key, consumer_secret, token: access_token, token_secret: access_token_secret}, false);

    T.stream('statuses/filter', {follow: ids});

    // There is still a conversion to a JSON object in this pipeline. It's not needed for this component.
    T
      .pipe(newline())
      .pipe(process.stdout);

    function newline() {
      return through2(function(chunk, encoding, callback) { // can't use fat arrow here because it remaps `this`!
        this.push(chunk + '\r\n');
        callback();
      });
    }
  }
}

following.nowFollow(['25073877', '1339835893', '23022687']);

function statuses(follow, log) {
  const stream = T.stream('statuses/filter', { follow });

  _.each(twitterHandlers(), (handler, name) => stream.on(name, handler));

  stream.on('error', error => console.error(error));

  const produces = {
    'twitter': {

    }
  };

  return {};
}

function twitterHandlers() {
  return {
    connected(response) {

    },

    delete(message) {

    },

    limit(message) {

    },

    message(message) {
      console.log(JSON.stringify(message));
    },

    tweet(tweet) {

    },

    scrub_geo(message) {

    }
  };
}