import express, { Request, Response, Router } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { mcpServer } from '../lib/mcpServer';

const router: Router = express.Router();
const transports = new Map<string, SSEServerTransport>();

router.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

router.get('/sse', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('SSE connection requested from:', req.headers['user-agent']);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const clientId = req.headers['x-client-id'] as string || `client_${Date.now()}`;
    
    // Create the transport with the correct message endpoint
    const transport = new SSEServerTransport('/api/mcp/messages', res);
    transports.set(clientId, transport);
    
    console.log(`Connecting MCP server for client: ${clientId}`);
    
    // This is the key - properly connect your mcpServer to the transport
    await mcpServer.connect(transport);
    
    console.log('MCP server connected successfully via SSE');
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      transports.delete(clientId);
      // Properly disconnect the server
      mcpServer.close().catch(console.error);
    });
    
    req.on('error', (error) => {
      console.error(`SSE connection error for client ${clientId}:`, error);
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

router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('MCP POST message received');
    console.log('Method:', req.body.method);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const clientId = req.headers['x-client-id'] as string || 'default';
    let transport = transports.get(clientId);

    console.log("transport:", transport)
    
    // Try to find any available transport if client ID doesn't match
    if (!transport && transports.size > 0) {
      transport = Array.from(transports.values())[0];
      console.log('Using fallback transport');
    }
    
    if (!transport) {
      console.error(`No transport available. Active transports: ${transports.size}`);
      res.status(424).json({ 
        error: 'MCP transport not initialized',
        activeTransports: transports.size,
        message: 'Please establish SSE connection first'
      });
      return;
    }
    
    // Let the transport handle the message - this routes to your mcpServer tools
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