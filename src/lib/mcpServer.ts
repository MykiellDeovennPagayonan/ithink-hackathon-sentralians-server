import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { fibonacci } from '../services/fibonacci';

export const mcpServer = new McpServer({
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

console.log('MCP Server instance initialized with tools:', ['getFibonacci', 'fibonacciSequence']);