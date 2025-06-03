import express, { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { mcpServer } from '../lib/mcpServer.js';

const router: Router = express.Router();
let transport: SSEServerTransport | null = null;

router.get('/sse', async (req: Request, res: Response): Promise<void> => {
  try {
    transport = new SSEServerTransport('/api/mcp/messages', res);
    await mcpServer.connect(transport);
  } catch (error) {
    console.error('MCP SSE connection error:', error);
    res.status(500).json({ error: 'Failed to establish MCP connection' });
  }
});

router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!transport) {
      res.status(400).json({ error: 'MCP transport not initialized' });
      return;
    }
    await transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('MCP message handling error:', error);
    res.status(500).json({ error: 'Failed to handle MCP message' });
  }
});

interface HealthResponse {
  status: string;
  mcp: {
    name: string;
    version: string;
    connected: boolean;
  };
}

router.get('/health', (req: Request, res: Response): void => {
  const healthResponse: HealthResponse = {
    status: 'ok',
    mcp: {
      name: 'Fibonacci Server',
      version: '1.0.0',
      connected: !!transport
    }
  };
  res.json(healthResponse);
});

export default router;