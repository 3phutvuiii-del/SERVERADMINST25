const net = require('net');

async function testRcon() {
  const host = '104.234.180.69';
  const port = 8888;
  const password = 'Rasgawu1227asdasd';

  console.log(`Connecting to RCON ${host}:${port}...`);
  const socket = new net.Socket();

  socket.setTimeout(5000);

  socket.on('connect', () => {
    console.log('Connected to RCON TCP port!');
    // Send auth packet
    const body = Buffer.from(password, 'utf8');
    const length = 10 + body.length + 1;
    const packet = Buffer.alloc(length + 4);
    packet.writeInt32LE(length, 0);
    packet.writeInt32LE(1, 4); // reqId = 1
    packet.writeInt32LE(3, 8); // SERVERDATA_AUTH = 3
    body.copy(packet, 12);
    packet.writeInt8(0, 12 + body.length);
    packet.writeInt8(0, 12 + body.length + 1);
    socket.write(packet);
  });

  socket.on('data', (data) => {
    console.log('Received RCON data:', data);
  });

  socket.on('error', (err) => {
    console.log('RCON Error:', err.message);
  });

  socket.on('timeout', () => {
    console.log('RCON Timeout');
    socket.destroy();
  });
}

testRcon();
