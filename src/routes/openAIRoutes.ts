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

async function callOpenAIFunction(
  userContent: string,
  tool: ChatCompletionTool,
): Promise<ChatCompletionMessage> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that always returns exactly one function call payload for math operations.',
    },
    { role: 'user', content: userContent },
  ];

  console.log(messages);

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
 *     arguments: {
 *       process: string,
 *       where_wrong: string[],
 *       steps: Array<{
 *         mathjs: string,
 *         latex: string,
 *         step_number: number,
 *         description: string
 *       }>
 *     }
 *   }
 * }
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

      const userPrompt = `Validate the following solution.\n\nQuestion:\n${question}\n\nSolution image URL:\n${image_url}\n\nReturn only a JSON function call payload.`;
      const message = await callOpenAIFunction(userPrompt, validateSolution);

      if (message.tool_calls) {
        const argumentsInitial = JSON.parse(
          message.tool_calls[0].function.arguments,
        );
        message.tool_calls[0].function.arguments = argumentsInitial;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /validate-solution:', error);
      res.status(500).json({ error: 'Failed to call validate_solution' });
    }
  },
);

/**
 * Route 2: Generate new problems based on topic or reference question
 *
 * Expects JSON body:
 * {
 *   topic?: string,
 *   reference_question?: string,
 *   num_questions?: number (default: 1, max: 5)
 * }
 * Note: At least one of topic or reference_question must be provided
 *
 * Responds with:
 * {
 *   function_call: {
 *     name: string,
 *     arguments: {
 *       problems: Array<{
 *         difficulty: "easy" | "medium" | "hard",
 *         topic: string,
 *         problem_latex: string
 *       }>
 *     }
 *   }
 * }
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

      let userPrompt = `Generate ${num_questions} new math problems.`;

      if (reference_question?.trim()) {
        userPrompt += ` Use reference question:\n${reference_question.trim()}`;
      }

      if (topic?.trim()) {
        userPrompt += reference_question?.trim()
          ? `\n\nIf additional topic context is needed, use:\n${topic.trim()}`
          : ` Based on the topic:\n${topic.trim()}`;
      }

      userPrompt += `\n\nReturn only a JSON function call payload.`;

      const message = await callOpenAIFunction(userPrompt, generateProblems);

      if (message.tool_calls) {
        const argumentsInitial = JSON.parse(
          message.tool_calls[0].function.arguments,
        );
        message.tool_calls[0].function.arguments = argumentsInitial;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /generate-problems:', error);
      res.status(500).json({ error: 'Failed to call generate_problems' });
    }
  },
);

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
 *     arguments: {
 *       process: string,
 *       steps: Array<{
 *         mathjs: string,
 *         latex: string,
 *         step_number: number,
 *         description: string
 *       }>
 *     }
 *   }
 * }
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

      let userPrompt = `Solve the following problem and return the detailed process (logic and LaTeX) plus steps.\n\nQuestion:\n${question}`;
      if (image_url) {
        userPrompt += `\n\nIf the problem is in the image, use this URL:\n${image_url}`;
      }
      userPrompt += `\n\nReturn only a JSON function call payload.`;

      const message = await callOpenAIFunction(userPrompt, solveProblem);

      if (message.tool_calls) {
        const argumentsInitial = JSON.parse(
          message.tool_calls[0].function.arguments,
        );
        message.tool_calls[0].function.arguments = argumentsInitial;
        res.json({ function_call: message.tool_calls[0] });
        return;
      }

      res.json({ function_call: message });
    } catch (error) {
      console.error('Error in /solve-problem:', error);
      res.status(500).json({ error: 'Failed to call solve_problem' });
    }
  },
);

export default router;
