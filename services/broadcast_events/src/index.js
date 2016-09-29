import {Server} from 'ws';

const server = new Server({port:8080});

console.log('server created');
server.on('connection', socket => {
  console.log('connected');
  server.clients.forEach(client => client.send('o')); //dupe?
});


console.log('listeners established');

process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('process listener');

process.stdin.on('data', chunk => {
  const lines = chunk.split('\n');

  lines.forEach(line => line !== '' && server.clients.forEach(client => client.send(line) & console.log(line)));
});

console.log('listening');