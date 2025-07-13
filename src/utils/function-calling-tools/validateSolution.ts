import { ChatCompletionTool } from 'openai/resources/index.mjs';

const validateSolution: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'validate_solution',
    description:
      'Checks the student’s solution, solves the question for verification, provides feedback, and scores the work based on provided criteria.',
    parameters: {
      type: 'object',
      properties: {
        image_description: {
          type: 'string',
          description:
            'Describe the image the user has attached, which contains their solution. Note if the image is clear and relevant to the question.',
        },
        user_solution: {
          type: 'string',
          description:
            `Based on the image, transcribe and describe the user's step-by-step solution.`,
        },
        process: {
          type: 'string',
          description:
            `Provide a correct, step-by-step solution to the original problem for comparison. Use inline math \`$...$\` for expressions and display math \`$$...$$\` for standalone equations.`,
        },
        where_wrong: {
          type: 'array',
          description:
            "Identify specific steps or concepts where the user made errors. Provide clear explanations for each mistake.",
          items: {
            type: 'string',
          },
        },
        score: {
            type: 'object',
            description: 'A detailed scoring of the user\'s solution based on the provided criteria.',
            properties: {
                given: { type: 'number', description: 'Points awarded for correctly identifying the "given" information.' },
                solution: { type: 'number', description: 'Points awarded for the correctness of the solution process.' },
                finalAnswer: { type: 'number', description: 'Points awarded for the correct final answer.' },
                total: { type: 'number', description: 'The sum of all awarded points.' },
                justification: { type: 'string', description: 'A brief explanation of why the score was given.' }
            },
            required: ['given', 'solution', 'finalAnswer', 'total', 'justification']
        },
        steps: {
          type: 'array',
          description:
            'A sequence of step objects for the correct solution, each containing a MathJS expression, LaTeX, step number, and explanation.',
          items: {
            type: 'object',
            properties: {
              mathjs: {
                type: 'string',
                description:
                  'A MathJS expression (e.g., `a * x + b = 0`).',
              },
              latex: {
                type: 'string',
                description:
                  'LaTeX representation (`$...$` for inline, `$$...$$` for display).',
              },
              step_number: {
                type: 'integer',
                description:
                  'Step index (starting at 1).',
              },
              description: {
                type: 'string',
                description:
                  "Natural-language explanation of the step (e.g., 'Subtract $b$ from both sides').",
              },
            },
            required: ['mathjs', 'latex', 'step_number', 'description'],
          },
        },
      },
      required: ["image_description", 'user_solution', 'process', 'where_wrong', 'score', 'steps'],
    },
  },
};

export default validateSolution;