import express from 'express';
import cors from 'cors';

import corsOptions from './config/corsConfig';
import uploadRoutes from './routes/uploadRoutes';
import mcpRoutes from './routes/mcpRoutes';
import aiRoutes from './routes/openAIRoutes';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is up!');
});

app.use('/api/uploadthing', uploadRoutes());

app.use('/api/mcp', mcpRoutes);

app.use('/api/ai', aiRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'API Server with MCP Support',
    endpoints: {
      uploadthing: '/api/uploadthing',
      mcp: {
        sse: '/api/mcp/sse',
        messages: '/api/mcp/messages',
        health: '/api/mcp/health'
      },
      ai: {
        chat: '/api/ai/chat',
        approve: '/api/ai/chat/approve',
        tools: '/api/ai/tools'
      }
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

export default app;