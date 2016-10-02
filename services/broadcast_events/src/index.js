import {Server} from 'ws';

const server = new Server({port:8080});

console.log('server created');
server.on('connection', socket => {
  console.log('c', server.clients.length, socket._socket.remoteAddress);

  socket.on('close', () => broadcast('o-') & console.log('d', server.clients.length, socket._socket.remoteAddress));
  broadcast(`o,${socket._socket.remoteAddress.split('.').slice(0, 2).join('.')}`);
});

function broadcast(msg) {
  server.clients.forEach(client => {
    try {
      client.send(msg);
    }
    catch (e) {
      console.error(e);
    }
  });
}

console.log('listeners established');

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('process listener');

process.stdin.on('data', chunk => {
  const lines = chunk.split('\n');

  lines.forEach(line => line !== '' && server.clients.forEach(client => {try {client.send(line); } catch (e) { console.error(e); }}) & console.log(line));
});

console.log('listening');