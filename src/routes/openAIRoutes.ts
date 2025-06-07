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

const router: Router = express.Router();

/**
 * A generic function to call OpenAI's function-calling API with pre-built messages.
 * Accepts an array of ChatCompletionMessageParam to support both text and images.
 */
async function callOpenAIFunction(
  messages: ChatCompletionMessageParam[],
  tool: ChatCompletionTool,
): Promise<ChatCompletionMessage> {
  console.log('Outgoing Messages:', JSON.stringify(messages, null, 2));

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
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
          content: 'You are a helpful assistant that always returns exactly one function call payload for math operations.',
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: image_url } },
            { type: 'text', text: `Validate the following solution for question:\n${question}` }
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
      userElements.push({ type: 'text', text: `Generate ${num_questions} new math problems.` });

      if (reference_question?.trim()) {
        userElements.push({ type: 'text', text: `Reference question:\n${reference_question.trim()}` });
      }
      if (topic?.trim()) {
        userElements.push({ type: 'text', text: `Topic:\n${topic.trim()}` });
      }

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a helpful assistant that always returns exactly one function call payload for math operations.' },
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

      const contentElements: any[] = [];
      if (image_url) {
        contentElements.push({ type: 'image_url', image_url: { url: image_url } });
      }
      contentElements.push({ type: 'text', text: `Solve the following problem and return the detailed process (logic and LaTeX) plus steps.\nQuestion:\n${question}` });

      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are a helpful assistant that always returns exactly one function call payload for math operations.' },
        { role: 'user', content: contentElements },
      ];

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

export default router;
