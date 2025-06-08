import { ChatCompletionTool } from 'openai/resources/index';

const askWolfram: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'askWolfram',
    description: `
Query WolframAlpha for mathematical, scientific, or factual data using keyword-optimized English inputs.

Capabilities:
- Solves mathematical equations, differential equations (ODEs), integrals, derivatives, and expressions.
- Computes values for unit conversions, physical constants, scientific formulas, and symbolic math.
- Handles real-world fact queries (e.g., population, gravity on Mars, boiling point of ethanol).
- Performs present worth and multi-year cash flow financial calculations.

Formatting Rules:
- Always write math problems as single-line inputs, using math notation:
  - Use \`solve dy/dt = 2 - y/10, y(0) = 0\` for differential equations.
  - Use \`^ \` for exponents (e.g., \`10^6\`), not \`e\` notation.
  - Use \`* \` for multiplication explicitly when needed (e.g., \`4 * L/min\`).
  - Use parentheses to group terms if clarity is needed.
  - Use clear variable names: \`x\`, \`y\`, \`t\`, etc.
- If the input is verbose or narrative, rephrase it into math-friendly keywords or equations before submitting.
- Wrap LaTeX in \`$$ ... $$\` for block math and \`\\( ... \\)\` for inline math in responses.

Query Structure:
- Input must always be a single-line string: \`{ "input": "your_query" }\`.
- If solving a DE or ODE, always include an initial condition (e.g., \`y(0) = 0\`).
- Always use scientific units: kg, m, L, J, %, etc.

Behavior:
- Translate non-English inputs to English before sending.
- If WolframAlpha provides assumption options and the result is invalid, retry using the same input with the most relevant assumption.
- If there are no assumptions and the result is irrelevant or empty, rephrase or simplify the input for a second attempt.
- Never mention AI limitations or model cutoff dates—WolframAlpha returns live data.
- Always return results in simplified Markdown-formatted English.
    `.trim(),
    parameters: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description:
            'A math-optimized, single-line English query for WolframAlpha. Use math expressions when solving equations, integrals, or differential problems.',
        },
      },
      required: ['input'],
    },
  },
};

export default askWolfram;
