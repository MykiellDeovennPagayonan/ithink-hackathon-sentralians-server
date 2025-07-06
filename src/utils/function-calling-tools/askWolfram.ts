import { ChatCompletionTool } from 'openai/resources/index';

const askWolfram: ChatCompletionTool = {
 type: 'function',
 function: {
   name: 'askWolfram',
   description: 'Query WolframAlpha for mathematical computations, scientific calculations, and factual data using optimized keyword inputs.',
   parameters: {
     type: 'object',
     properties: {
       input: {
         type: 'string',
         description: `
A math-optimized, single-line English query for WolframAlpha.

Capabilities:
- Solves mathematical equations, differential equations (ODEs), integrals, derivatives, and expressions.
- Computes values for unit conversions, physical constants, scientific formulas, and symbolic math.
- Handles real-world fact queries (e.g., population, gravity on Mars, boiling point of ethanol).
- Performs present worth and multi-year cash flow financial calculations.

Formatting Rules:
- Always write math problems as single-line inputs, using math notation:
 - Use \`solve dy/dt = 2 - y/10, y(0) = 0\` for differential equations.
 - Use \`^\` for exponents (e.g., \`10^6\`), not \`e\` notation.
 - Use \`*\` for multiplication explicitly when needed (e.g., \`4 * L/min\`).
 - Use parentheses to group terms if clarity is needed.
 - Use clear variable names: \`x\`, \`y\`, \`t\`, etc.
- If the input is verbose or narrative, rephrase it into math-friendly keywords or equations before submitting.

Query Structure:
- Input must always be a single-line string.
- If solving a DE or ODE, always include an initial condition (e.g., \`y(0) = 0\`).
- Always use scientific units: kg, m, L, J, %, etc.

Guidelines:
- Translate non-English inputs to English before sending.
- Use math expressions when solving equations, integrals, or differential problems.
- Rephrase verbose queries into concise, keyword-optimized format.

Examples:
- Mathematical: \`solve x^2 + 5x - 6 = 0\`
- Calculus: \`integrate x^2 * sin(x) dx\`
- Differential equation: \`solve dy/dt = 3y - 2, y(0) = 1\`
- Unit conversion: \`convert 25 mph to km/h\`
- Scientific fact: \`density of water at 20 degrees celsius\`
- Financial: \`present value of $1000 per year for 10 years at 5% interest\`
         `.trim(),
       },
     },
     required: ['input'],
   },
 },
};

export default askWolfram;