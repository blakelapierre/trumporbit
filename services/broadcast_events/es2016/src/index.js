// import SegfaultHandler from 'segfault-handler';

// SegfaultHandler.registerHandler('crash.log');

import {Server} from 'uws';
// import {Server} from 'ws';

const server = new Server({port:8080});

console.log('server created');
let connected = 0;
server.on('connection', socket => {
  const {_socket: {remoteAddress}} = socket;
  process.stdout.write(`c ${++connected} ${remoteAddress}\n`);

  // bins['o'].push(`o,${connected},${remoteAddress.split('.').slice(0, 2).join('.')}`);
  // socket.on('close', () => bins['o-'].push('o-') & process.stdout.write(`d ${--connected}, ${remoteAddress}\n`));


  broadcast(`o,${connected},${remoteAddress.split('.').slice(0, 2).join('.')}`);
  socket.on('close', () => broadcast('o-') & process.stdout.write(`d ${--connected}, ${remoteAddress}\n`));

  process.nextTick(uncork);
});

let bins = { 'o': [], 'o-': [], 'lines': []},
    oneSecondBins = { 'o': [], 'o-': [], 'lines': []},
    targetSendsPerSecond = 60,
    lastSend = 0,
    lastStatus = 0;

function bin(name) {
  const value = bins[name];
  oneSecondBins['o'].push(value);
}

function tick() {
  const now = new Date().getTime();

  if (now - lastSend > (1000 / targetSendsPerSecond)) {
    broadcastBins(bins);

    bin('o');
    bin('o-');
    bin('lines');

    bins = { 'o': [], 'o-': [], 'lines': []};
    lastSend = now;
  }

  if (now - lastStatus > 1000) {
    process.stdout.write(`${new Date().getTime()} stats ${server.clients.length} ${oneSecondBins['o'].length} ${oneSecondBins['o-'].length} ${oneSecondBins['lines'].length}\n`);
    // process.stdout.write(`status ${})
    oneSecondBins = { 'o': [], 'o-': [], 'lines': []};
    lastStatus = now;
  }

  // process.nextTick(tick);
  setTimeout(tick, Math.min(0, 1000 / targetSendsPerSecond - new Date().getTime() - now));
}
// process.nextTick(tick);

function broadcastBins(bins) {
  broadcast(bins['o'].concat(bins['o-']).concat(bins['lines']).join('\n'));
}

function uncork() {
  process.stdin.uncork(); // wut?
}

function broadcast(msg) {
  if (msg && msg.length > 0) {
    server.broadcast(msg);
    // console.log(`broadcasting '${msg}'`);
  }
}

// function broadcast(msg) {
//   server.clients.forEach(client => client.send(msg, callback));
// }

// function broadcast(msg) {
//   server.clients.forEach(client => client.readyState === 1 && client.send(msg, callback));
// }

// function stdinCallback(error) {
//   if (error) console.error('stdin error', error);
// }

function callback(error) {
  if (error) console.error('Send error', error.message);
}

console.log('listeners established');

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('process listener');

process.stdin.on('data', chunk => {
  // bins['lines'].push(((chunk.toString() || '').replace(/\n\n/g, '\n').replace(/\n$/, '')));
  broadcast((chunk || '').replace(/\n\n/g, '\n').replace(/\n$/, ''));
  process.stdout.write(chunk);
  // const lines = chunk.split('\n');

  // lines.forEach(line => line !== '' && broadcast(line) & process.stdout.write(`${line}\n`));
});

console.log('listening');