import express, { Request, Response, Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { fibonacci } from '../services/fibonacci.js';

const router: Router = express.Router();

const mcpServer = new McpServer({
  name: 'Fibonacci Server',
  version: '1.0.0',
});

mcpServer.tool(
  'getFibonacci',
  'Calculate the nth Fibonacci number',
  {
    n: z.number().int().min(0).describe('The position in the Fibonacci sequence'),
  },
  async ({ n }) => {
    console.log(`MCP tool called: getFibonacci(${n})`);
    const result = fibonacci(n);
    return {
      content: [
        {
          type: 'text',
          text: `The ${n}th Fibonacci number is ${result}.`,
        },
      ],
    };
  }
);

mcpServer.tool(
  'fibonacciSequence',
  'Get a sequence of Fibonacci numbers up to n',
  {
    count: z.number().int().min(1).max(50).describe('Number of Fibonacci numbers to generate'),
  },
  async ({ count }) => {
    console.log(`MCP tool called: fibonacciSequence(${count})`);
    const sequence = [];
    for (let i = 0; i < count; i++) {
      sequence.push(fibonacci(i));
    }
    return {
      content: [
        {
          type: 'text',
          text: `Fibonacci sequence (${count} numbers): ${sequence.join(', ')}`,
        },
      ],
    };
  }
);

let activeTransport: SSEServerTransport | null = null;
let isServerConnected = false;

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

// SSE endpoint for MCP connection
router.get('/sse', async (req: Request, res: Response) => {
  try {
    console.log('SSE connection request received');
    
    // If there's already an active connection, close it first
    if (activeTransport) {
      console.log('Closing existing transport');
      try {
        await activeTransport.close();
      } catch (e) {
        console.warn('Error closing existing transport:', e);
      }
      activeTransport = null;
      isServerConnected = false;
    }

    // Create the messages URL (this should point to your /messages endpoint)
    const messagesUrl = `${req.protocol}://${req.get('host')}/api/mcp/messages`;
    console.log('Messages URL:', messagesUrl);

    // Create new transport
    activeTransport = new SSEServerTransport(messagesUrl, res);
    
    // Connect the MCP server to the transport
    await mcpServer.connect(activeTransport);
    isServerConnected = true;
    
    console.log('MCP server connected successfully via SSE');

    // Handle client disconnect
    req.on('close', () => {
      console.log('SSE client disconnected');
      if (activeTransport) {
        activeTransport.close().catch(console.error);
        activeTransport = null;
      }
      isServerConnected = false;
    });

    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      if (activeTransport) {
        activeTransport.close().catch(console.error);
        activeTransport = null;
      }
      isServerConnected = false;
    });

  } catch (error) {
    console.error('Failed to establish SSE connection:', error);
    
    // Clean up
    if (activeTransport) {
      activeTransport.close().catch(console.error);
      activeTransport = null;
    }
    isServerConnected = false;
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to establish MCP connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Messages endpoint for MCP communication
router.post('/messages', async (req: Request, res: Response) => {
  try {
    console.log('MCP message received:', JSON.stringify(req.body, null, 2));
    
    if (!activeTransport) {
      console.error('No active transport available');
      res.status(424).json({ 
        error: 'MCP transport not available',
        message: 'Please establish SSE connection first'
      });
      return;
    }

    if (!isServerConnected) {
      console.error('MCP server not connected');
      res.status(424).json({ 
        error: 'MCP server not connected',
        message: 'Server connection is not established'
      });
      return;
    }

    // Let the transport handle the message
    await activeTransport.handlePostMessage(req, res);
    
  } catch (error) {
    console.error('Error handling MCP message:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to handle MCP message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    mcp: {
      name: 'Fibonacci Server',
      version: '1.0.0',
      connected: isServerConnected,
      hasTransport: !!activeTransport,
      tools: ['getFibonacci', 'fibonacciSequence']
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('Health check:', health);
  res.json(health);
});

// Debug endpoint to list available tools
router.get('/debug/tools', (req: Request, res: Response) => {
  res.json({
    message: 'MCP Server Tools',
    tools: [
      {
        name: 'getFibonacci',
        description: 'Calculate the nth Fibonacci number',
        inputSchema: {
          type: 'object',
          properties: {
            n: {
              type: 'number',
              description: 'The position in the Fibonacci sequence'
            }
          },
          required: ['n']
        }
      },
      {
        name: 'fibonacciSequence',
        description: 'Get a sequence of Fibonacci numbers up to n',
        inputSchema: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              description: 'Number of Fibonacci numbers to generate'
            }
          },
          required: ['count']
        }
      }
    ],
    serverInfo: {
      name: 'Fibonacci Server',
      version: '1.0.0',
      connected: isServerConnected
    }
  });
});

export default router;