import OpenAI from 'openai';

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getMcpServerUrl(): string {
  return 'http://localhost:3000/api/mcp/sse';
}

export async function testMcpConnection(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/mcp/health');
    return response.ok;
  } catch (error) {
    console.error('MCP server connection test failed:', error);
    return false;
  }
}