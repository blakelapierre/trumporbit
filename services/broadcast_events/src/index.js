import {Server} from 'uws';

const server = new Server({port:8080});

console.log('server created');
let connected = 0;
server.on('connection', socket => {
  const {_socket: {remoteAddress}} = socket;
  console.log('c', ++connected, remoteAddress);

  socket.on('close', () => broadcast('o-') & console.log('d', --connected, remoteAddress));
  broadcast(`o,${remoteAddress.split('.').slice(0, 2).join('.')}`);
});

function broadcast(msg) {
  server.broadcast(msg);
}

console.log('listeners established');

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('process listener');

process.stdin.on('data', chunk => {
  const lines = chunk.split('\n');

  lines.forEach(line => line !== '' && server.broadcast(line) & console.log(line));
});

console.log('listening');