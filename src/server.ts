import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './index';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('UPLOADTHING_TOKEN:', process.env.UPLOADTHING_TOKEN);
  console.log(`Server is running on http://localhost:${PORT}`);
});
