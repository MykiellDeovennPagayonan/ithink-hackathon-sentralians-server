import OpenAI from 'openai';

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getMcpServerUrl(): string {
  return 'https://ithink-hackathon-sentralians-server.onrender.com/api/mcp/sse';
}

export async function testMcpConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://ithink-hackathon-sentralians-server.onrender.com/api/mcp/health');
    return response.ok;
  } catch (error) {
    console.error('MCP server connection test failed:', error);
    return false;
  }
}