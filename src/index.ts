import express from 'express';
import cors from 'cors';

import corsOptions from './config/corsConfig.js';
import uploadRoutes from './routes/uploadRoutes.js';
import mcpRoutes from './routes/mcpRoutes.js';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/uploadthing', uploadRoutes());

app.use('/api/mcp', mcpRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'API Server with MCP Support',
    endpoints: {
      uploadthing: '/api/uploadthing',
      mcp: {
        sse: '/api/mcp/sse',
        messages: '/api/mcp/messages',
        health: '/api/mcp/health'
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

export default app;