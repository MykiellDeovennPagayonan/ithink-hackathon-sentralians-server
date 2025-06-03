import express, { Request, Response, Router } from 'express';
import { openaiClient, getMcpServerUrl, testMcpConnection } from '../lib/openAI';
import { Tool } from 'openai/resources/responses/responses';

const router: Router = express.Router();

interface ChatRequest {
  message: string;
  requireApproval?: boolean;
  allowedTools?: string[];
}

interface ChatResponse {
  response: string;
  toolCalls?: any[];
  approvalRequests?: any[];
}

router.get('/test-mcp', async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await testMcpConnection();
    const mcpUrl = getMcpServerUrl();
    
    res.json({
      mcp_server_url: mcpUrl,
      mcp_server_accessible: isConnected,
      message: isConnected ? 'MCP server is accessible' : 'MCP server is not accessible'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test MCP connection' });
  }
});

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, requireApproval = true, allowedTools }: ChatRequest = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const isMcpAccessible = await testMcpConnection();
    if (!isMcpAccessible) {
      res.status(503).json({ 
        error: 'MCP server is not accessible',
        mcp_url: getMcpServerUrl(),
        suggestion: 'Make sure your MCP server is running and accessible'
      });
      return;
    }

    const mcpTool: Tool =         {
      type: "mcp",
      server_label: "fibonacci_server",
      server_url: getMcpServerUrl(),
      require_approval: requireApproval ? "always" : "never",
    }

    if (allowedTools && allowedTools.length > 0) {
      mcpTool.allowed_tools = allowedTools;
    }

    console.log('Making OpenAI request with MCP tool:', JSON.stringify(mcpTool, null, 2));

    const response = await openaiClient.responses.create({
      model: "gpt-4.1",
      tools: [mcpTool],
      input: message,
    });

    const chatResponse: ChatResponse = {
      response: response.output_text || '',
      toolCalls: response.output?.filter((item: { type: string; }) => item.type === 'mcp_call') || [],
      approvalRequests: response.output?.filter((item: { type: string; }) => item.type === 'mcp_approval_request') || [],
    };

    res.json(chatResponse);

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to process chat request',
        details: error.message,
        mcp_url: getMcpServerUrl()
      });
    } else {
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  }
});

router.post('/chat/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { approvalRequestId, approve, previousResponseId } = req.body;

    if (!approvalRequestId || !previousResponseId) {
      res.status(400).json({ error: 'Approval request ID and previous response ID are required' });
      return;
    }

    const response = await openaiClient.responses.create({
      model: "gpt-4o-mini",
      tools: [{
        type: "mcp",
        server_label: "fibonacci_server",
        server_url: getMcpServerUrl(),
      }],
      previous_response_id: previousResponseId,
      input: [{
        type: "mcp_approval_response",
        approve: approve,
        approval_request_id: approvalRequestId
      }],
    });

    const chatResponse: ChatResponse = {
      response: response.output_text || '',
      toolCalls: response.output?.filter((item: { type: string; }) => item.type === 'mcp_call') || [],
      approvalRequests: response.output?.filter((item: { type: string; }) => item.type === 'mcp_approval_request') || [],
    };

    res.json(chatResponse);

  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

router.get('/tools', async (req: Request, res: Response): Promise<void> => {
  try {
    const isMcpAccessible = await testMcpConnection();
    if (!isMcpAccessible) {
      res.status(503).json({ 
        error: 'MCP server is not accessible',
        mcp_url: getMcpServerUrl()
      });
      return;
    }

    const response = await openaiClient.responses.create({
      model: "gpt-4.1",
      tools: [{
        type: "mcp",
        server_label: "fibonacci_server",
        server_url: getMcpServerUrl(),
        require_approval: "never",
      }],
      input: "List available tools"
    });

    const toolListItems = response.output?.filter((item: { type: string; }) => item.type === 'mcp_list_tools') || [];
    
    res.json({
      tools: toolListItems.length > 0 ? toolListItems[0].id : [],
      server_url: getMcpServerUrl()
    });

  } catch (error) {
    console.error('Tools discovery error:', error);
    res.status(500).json({ error: 'Failed to discover tools' });
  }
});

export default router;