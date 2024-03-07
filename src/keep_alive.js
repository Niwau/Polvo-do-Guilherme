const http = require('http');

http.createServer((req, res) => {
  res.end('I am alive!');
}).listen(8080);
