import express, { Request, Response, Router } from 'express';
import {
  ChatCompletionMessageParam,
  ChatCompletionMessage,
  ChatCompletionTool,
} from 'openai/resources/index';
import { openaiClient } from '../lib/openAI';

import validateSolution from '../utils/function-calling-tools/validateSolution';
import generateProblems from '../utils/function-calling-tools/generateProblems';
import solveProblem from '../utils/function-calling-tools/solveProblem';
import askWolfram from '../utils/function-calling-tools/askWolfram';

const router: Router = express.Router();

const WOLFRAM_APP_ID = process.env.WOLFRAM_APP_ID || 'YOUR_WOLFRAM_APP_ID_HERE';

async function callOpenAIFunction(
  messages: ChatCompletionMessageParam[],
  tool: ChatCompletionTool,
): Promise<ChatCompletionMessage> {
  console.log('Outgoing Messages:', JSON.stringify(messages, null, 2));

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: [tool],
    max_tokens: 15010,
    temperature: 0,
  });

  console.log('completion: ', completion);

  const message = completion.choices[0].message;
  console.log('message: ', message);
  if (message.tool_calls) {
    console.log('toolcall: ', message.tool_calls[0].function);
  }
  return message;
}

/**
 * Route 1: Validate a student's solution (image URL + question text)
 */
router.post(
  '/validate-solution',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, image_url } = req.body;
      if (!question || !image_url) {
        res
          .status(400)
          .json({ error: "'question' and 'image_url' are required" });
        return;
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant that always returns exactly one function call to validate my solution to your question',
        },
        {
          role: 'assistant',
          content: `Here's the question I need you to solve:\n\n${question}`,
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: image_url } },
            {
              type: 'text',
              text: `Here's my solution to the problem you asked. Is it correct?`,
            },
          ],
        },
      ];

      const message = await callOpenAIFunction(messages, validateSolution);

      if (message.tool_calls) {
        const args = JSON.parse(message.tool_calls[0].function.arguments);
        message.tool_calls[0].function.arguments = args;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /validate-solution:', error);
      res.status(500).json({ error: 'Failed to call validateSolution' });
    }
  },
);

/**
 * Route 2: Generate new problems based on topic or reference question
 */
router.post(
  '/generate-problems',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { topic, reference_question, num_questions = 1 } = req.body;

      if (!topic?.trim() && !reference_question?.trim()) {
        res.status(400).json({
          error:
            "At least one of 'topic' or 'reference_question' must be provided",
        });
        return;
      }

      if (
        typeof num_questions !== 'number' ||
        num_questions < 1 ||
        num_questions > 5
      ) {
        res.status(400).json({
          error: "'num_questions' must be a number between 1 and 5",
        });
        return;
      }

      const userElements: any[] = [];
      userElements.push({
        type: 'text',
        text: `Generate ${num_questions} new math problems.`,
      });

      if (reference_question?.trim()) {
        userElements.push({
          type: 'text',
          text: `Reference question:\n${reference_question.trim()}`,
        });
      }
      if (topic?.trim()) {
        userElements.push({ type: 'text', text: `Topic:\n${topic.trim()}` });
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant that always returns exactly one function call payload for math operations.',
        },
        { role: 'user', content: userElements },
      ];

      const message = await callOpenAIFunction(messages, generateProblems);

      if (message.tool_calls) {
        const args = JSON.parse(message.tool_calls[0].function.arguments);
        message.tool_calls[0].function.arguments = args;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /generate-problems:', error);
      res.status(500).json({ error: 'Failed to call generateProblems' });
    }
  },
);

/**
 * Route 3: Solve a question and return full process
 */
router.post(
  '/solve-problem',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, image_url } = req.body;
      if (!question) {
        res.status(400).json({ error: "'question' is required" });
        return;
      }

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant that always returns exactly one function call payload for math operations.',
        },
        {
          role: 'user',
          content: `I need to solve this problem:\n\n${question}`,
        },
      ];

      const userContent: any[] = [];
      if (image_url) {
        userContent.push({
          type: 'image_url',
          image_url: { url: image_url },
        });
      }
      userContent.push({
        type: 'text',
        text: `Please solve this step by step.`,
      });

      messages.push({
        role: 'user',
        content: userContent,
      });

      const message = await callOpenAIFunction(messages, solveProblem);

      if (message.tool_calls) {
        const args = JSON.parse(message.tool_calls[0].function.arguments);
        message.tool_calls[0].function.arguments = args;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /solve-problem:', error);
      res.status(500).json({ error: 'Failed to call solveProblem' });
    }
  },
);

router.post(
  '/ask-wolfram',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { question, image_url } = req.body;
      if (!question || typeof question !== 'string') {
        res
          .status(400)
          .json({ error: "'question' is required and must be a string" });
        return;
      }

      const firstResponse = await callOpenAIFunction(
        [
          {
            role: 'system',
            content: 'You are a math and science assistant.',
          },
          {
            role: 'user',
            content: `Rewrite the user's natural language question into a precise and keyword-optimized single-line WolframAlpha input query string.

Format: { "input": "your_query" }

Ensure the query:
- Is English only
- Uses exponential notation like 6*10^14
- Focuses on computable data only
- Omits fluff and context not needed for computation

User question:
"${question}"`,
          },
        ],
        askWolfram,
      );

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a math and science assistant.',
        },
        {
          role: 'user',
          content: `Process this query from the previous step.`,
        },
        {
          role: 'assistant',
          content: firstResponse.content || '',
          tool_calls: firstResponse.tool_calls,
        },
      ];

      const message = await callOpenAIFunction(messages, askWolfram);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        res
          .status(500)
          .json({ error: 'No function call returned from OpenAI' });
        return;
      }

      const funcCall = message.tool_calls[0];
      if (funcCall.function.name !== 'askWolfram') {
        res.status(500).json({ error: 'Unexpected function call name' });
        return;
      }

      const args = JSON.parse(funcCall.function.arguments);
      const wolframQuery = args.input;

      // Step 2: Query WolframAlpha API
      const url = new URL('https://api.wolframalpha.com/v2/query');
      url.searchParams.append('appid', WOLFRAM_APP_ID);
      url.searchParams.append('input', wolframQuery);
      url.searchParams.append('output', 'JSON');
      url.searchParams.append('format', 'plaintext,image');

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`WolframAlpha API error: ${response.statusText}`);
      }
      const data = await response.json();

      // Step 3: Parse Wolfram result
      if (!data.queryresult.success) {
        res.json({
          question,
          image_url: image_url || null,
          wolframQuery,
          answer: 'Wolfram Alpha did not understand or solve the query.',
        });
        return;
      }

      const pods = data.queryresult.pods || [];
      let answerText = 'No answer found.';
      if (pods.length > 0) {
        const primaryPod = pods.find((pod: any) => pod.primary) || pods[0];
        if (primaryPod && primaryPod.subpods && primaryPod.subpods.length > 0) {
          answerText = primaryPod.subpods
            .map((subpod: any) => subpod.plaintext)
            .filter(Boolean)
            .join('\n');
        }
      }

      res.json({
        question,
        image_url: image_url || null,
        wolframQuery,
        answer: answerText,
      });
    } catch (error) {
      console.error('Error in /ask-wolfram:', error);
      res.status(500).json({ error: 'Failed to process WolframAlpha query' });
    }
  },
);

export default router;