import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
const app = require('./index'); 

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
