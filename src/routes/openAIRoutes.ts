import express, { Request, Response, Router } from 'express';
import { ChatCompletionMessageParam, ChatCompletionMessage, ChatCompletionTool } from 'openai/resources/index';
import { openaiClient } from '../lib/openAI';

import validateSolution from '../utils/function-calling-tools/validateSolution';
import generateProblems from '../utils/function-calling-tools/generateProblems';
import solveProblem from '../utils/function-calling-tools/solveProblem';

const router: Router = express.Router();

async function callOpenAIFunction(
  userContent: string,
  tool: ChatCompletionTool
): Promise<ChatCompletionMessage> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: 'You are a helpful assistant that always returns exactly one function call payload for math operations.' },
    { role: 'user', content: userContent }
  ];

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: [tool],
    function_call: { name: tool.function.name },
    temperature: 0
  });

  const message = completion.choices[0].message;
  return message;
}

/**
 * Route 1: Validate a student’s solution (image URL + question text)
 *
 * Expects JSON body:
 * {
 *   question: string,
 *   image_url: string
 * }
 *
 * Responds with:
 * {
 *   function_call: {
 *     name: string,
 *     arguments: { question: string; image_url: string }
 *   }
 * }
 */
router.post('/validate-solution', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, image_url } = req.body;
    if (!question || !image_url) {
      res.status(400).json({ error: "'question' and 'image_url' are required" });
      return;
    }

    const userPrompt = `Validate the following solution.\n\nQuestion:\n${question}\n\nSolution image URL:\n${image_url}\n\nReturn only a JSON function call payload.`;
    const message = await callOpenAIFunction(userPrompt, validateSolution);

    res.json({ function_call: message.function_call });
  } catch (error) {
    console.error('Error in /validate-solution:', error);
    res.status(500).json({ error: 'Failed to call validate_solution' });
  }
});

/**
 * Route 2: Generate new problems based on topic or reference question
 *
 * Expects JSON body:
 * {
 *   topic: string,
 *   reference_question: string,
 *   num_questions: number
 * }
 *
 * Responds with:
 * {
 *   function_call: {
 *     name: string,
 *     arguments: { topic: string; reference_question: string; num_questions: number }
 *   }
 * }
 */
router.post('/generate-problems', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, reference_question, num_questions } = req.body;
    if (!reference_question || !topic || typeof num_questions !== 'number') {
      res.status(400).json({ error: "'topic', 'reference_question', and 'num_questions' are required" });
      return;
    }

    const userPrompt = `Generate ${num_questions} new math problems. Use reference question:\n${reference_question}\n\nIf additional topic context is needed, use:\n${topic}\n\nReturn only a JSON function call payload.`;
    const message = await callOpenAIFunction(userPrompt, generateProblems);

    res.json({ function_call: message.function_call });
  } catch (error) {
    console.error('Error in /generate-problems:', error);
    res.status(500).json({ error: 'Failed to call generate_problems' });
  }
});

/**
 * Route 3: Solve a question and return full process
 *
 * Expects JSON body:
 * {
 *   question: string,
 *   image_url?: string
 * }
 *
 * Responds with:
 * {
 *   function_call: {
 *     name: string,
 *     arguments: { question: string; image_url?: string }
 *   }
 * }
 */
router.post('/solve-problem', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, image_url } = req.body;
    if (!question) {
      res.status(400).json({ error: "'question' is required" });
      return;
    }

    let userPrompt = `Solve the following problem and return the detailed process (logic and LaTeX) plus steps.\n\nQuestion:\n${question}`;
    if (image_url) {
      userPrompt += `\n\nIf the problem is in the image, use this URL:\n${image_url}`;
    }
    userPrompt += `\n\nReturn only a JSON function call payload.`;

    const message = await callOpenAIFunction(userPrompt, solveProblem);
    res.json({ function_call: message.function_call });
  } catch (error) {
    console.error('Error in /solve-problem:', error);
    res.status(500).json({ error: 'Failed to call solve_problem' });
  }
});

export default router;
