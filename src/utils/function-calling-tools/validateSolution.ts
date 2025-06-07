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
        user_solution: {
          type: 'string',
          description:
            'The correct solution adn solving step by step to answer the question, use proper industry formulas needed by the prblem',
        },
        process: {
          type: 'string',
          description:
            'A natural-language narration of the entire solution’s logic using proper formula for the specific problem, interspersed with LaTeX expressions to represent symbolic manipulations (no numeric substitutions). Use inline math `$...$` for expressions within sentences and display math `$$...$$` for standalone equations. For example: "We start with $$ax + b = 0$$, isolate $x$ by subtracting $b$ and dividing by $a$."',
        },
        where_wrong: {
          type: 'array',
          description:
            "List of strings describing each incorrect step or misconception (e.g., 'Incorrect variable substitution in step 2', 'Misapplied distributive property in step 4'). Use plain text; do not include numeric examples.",
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
      required: ['user_solution', 'process', 'where_wrong', 'steps'],
      additionalProperties: false,
    },
  },
};

export default validateSolution;
