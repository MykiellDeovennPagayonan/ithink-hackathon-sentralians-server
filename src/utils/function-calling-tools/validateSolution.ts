import { ChatCompletionTool } from 'openai/resources/index.mjs';

const validateSolution: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'validate_solution',
    description:
      'Checks the student’s solution. Also solves the question as well to verify correctness',
    parameters: {
      type: 'object',
      properties: {
        image_description: {
          type: 'string',
          description:
            'Describe the image the user has attached basically their solution, do not include the question. let me know if the image is valid and is indeed answer the question',
        },
        user_solution: {
          type: 'string',
          description:
            `From the image description, and if it is valid please describe the user's step by step solution`,
        },
        process: {
          type: 'string',
          description:
            `Now show me a step by step solution on how the problem you asked should actually be done for us to compare the user's solution. Use inline math \`$...$\` for expressions within sentences and display math \`$$...$$\` for standalone equations. For example: "We start with $$ax + b = 0$$, isolate $x$ by subtracting $b$ and dividing by $a$."`,
        },
        where_wrong: {
          type: 'array',
          description:
            "Describe the steps where the user went wrong to validate their solution and for them to learn from",
          items: {
            type: 'string',
          },
        },
        steps: {
          type: 'array',
          description:
            'Sequence of step objects, each containing a MathJS-compatible expression, its LaTeX representation (using `$...$` or `$$...$$` as appropriate), a step number, and a concise, natural-language explanation. Do not perform numeric evaluations—keep variables symbolic.',
          items: {
            type: 'object',
            properties: {
              mathjs: {
                type: 'string',
                description:
                  'A MathJS expression using symbolic variables (e.g., `a * x + b = 0`).',
              },
              latex: {
                type: 'string',
                description:
                  'LaTeX representation of the same expression. Wrap inline expressions in `$...$` (e.g., `$a x + b = 0$`) and display equations in `$$...$$` if they appear on their own line (e.g., `$$a x + b = 0$$`). Use commands like `\\frac{}`, `^`, `_`, `\\sqrt{}`, etc.',
              },
              step_number: {
                type: 'integer',
                description:
                  'Index of this step in the overall solution (starting at 1).',
              },
              description: {
                type: 'string',
                description:
                  "Natural-language explanation of what this step accomplishes (no numeric evaluation). For example: 'Subtract $b$ from both sides to obtain $a x = -b$.'",
              },
            },
            required: ['mathjs', 'latex', 'step_number', 'description'],
            additionalProperties: false,
          },
        },
      },
      required: ["image_description", 'user_solution', 'process', 'where_wrong', 'steps'],
      additionalProperties: false,
    },
  },
};

export default validateSolution;
