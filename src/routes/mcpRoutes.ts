import express, { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { mcpServer } from '../lib/mcpServer';

const router: Router = express.Router();
const transports = new Map<string, SSEServerTransport>();
const FIXED_CLIENT_ID = 'fibonacci_client_123';

router.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-id');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

router.get('/sse', async (req: Request, res: Response) => {
  try {
    const clientId = (req.headers['x-client-id'] as string) || FIXED_CLIENT_ID;

    console.log('SSE connection requested from:', req.headers['user-agent']);
    console.log('Registering transport under key:', clientId);

    const messagesUrl = 'https://ithink-hackathon-sentralians-server.onrender.com/api/mcp/messages';

    const transport = new SSEServerTransport(messagesUrl, res);
    transports.set(clientId, transport);
    console.log('All active transports:', Array.from(transports.keys()));

    await mcpServer.connect(transport);
    console.log(`MCP server connected via SSE [clientId=${clientId}]`);

    req.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      transports.delete(clientId);
      mcpServer.close().catch(console.error);
    });
    req.on('error', (error) => {
      console.error(`SSE connection error for ${clientId}:`, error);
      transports.delete(clientId);
      mcpServer.close().catch(console.error);
    });
  } catch (error) {
    console.error('MCP SSE connection error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to establish MCP connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

router.post('/messages', async (req: Request, res: Response) => {
  try {
    console.log('MCP POST message received');
    console.log('POST x-client-id header:', req.headers['x-client-id']);
    console.log('Transport map keys:', Array.from(transports.keys()));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Request Headers:', req.headers)

    const clientId = (req.headers['x-client-id'] as string) || FIXED_CLIENT_ID;
    let transport = transports.get(clientId);

    console.log('Lookup transport by key:');

    if (!transport && transports.size > 0) {
      transport = Array.from(transports.values())[0];
      console.log('Using fallback transport');
    }

    if (!transport) {
      console.error(`No transport found for key=${clientId}. Active transports: ${transports.size}`);
      res.status(424).json({
        error: 'MCP transport not initialized',
        activeTransports: transports.size,
        message: 'Please open the SSE connection first with x-client-id set'
      });
      return;
    }

    // Let the transport decode the JSON-RPC payload and route it to mcpServer
    await transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('MCP message handling error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to handle MCP message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

router.get('/health', (req: Request, res: Response): void => {
  const healthResponse = {
    status: 'ok',
    mcp: {
      name: 'Fibonacci Server',
      version: '1.0.0',
      connected: transports.size > 0,
      activeConnections: transports.size,
      transports: Array.from(transports.keys())
    }
  };
  console.log('Health check:', healthResponse);
  res.json(healthResponse);
});

router.get('/debug/tools', (req: Request, res: Response): void => {
  try {
    res.json({
      message: 'MCP Server is initialized',
      tools: ['getFibonacci', 'fibonacciSequence'],
      serverName: 'Fibonacci Server',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
