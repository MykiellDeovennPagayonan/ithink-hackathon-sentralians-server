import { ChatCompletionTool } from "openai/resources/index.mjs";

const generateProblems: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_problems",
    description: "Returns a list of newly generated math problems. Use LaTeX formatting only when the problem contains mathematical expressions, equations, or formulas that need proper mathematical notation.",
    parameters: {
      type: "object",
      properties: {
        problems: {
          type: "array",
          description: "Array of generated problem objects.",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "A brief, descriptive title for the problem (e.g., 'Linear Equation Solving', 'Area of Rectangle', 'Derivative Calculation')."
              },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
                description: "Difficulty rating of this problem."
              },
              topic: {
                type: "string",
                description: "The mathematical topic or category (e.g., 'algebra', 'calculus', 'geometry')."
              },
              problem_latex: {
                type: "string",
                description: "The complete problem statement. If the problem contains mathematical expressions, equations, fractions, exponents, or other mathematical notation, format those parts using LaTeX syntax with display math delimiters $$...$$ for equations and inline math $...$ for expressions within text. Use LaTeX commands like \\frac{}{}, \\sqrt{}, ^{}, _{}, etc. For purely text-based problems without mathematical notation, use plain text. Examples: '$$\\frac{1}{3}a = \\frac{1}{7}c$$ Solve this equation.' or 'A triangle has angles of 30°, 60°, and 90°. What type of triangle is this?'"
              }
            },
            required: ["title", "difficulty", "topic", "problem_latex"],
            additionalProperties: false
          }
        }
      },
      required: ["problems"],
      additionalProperties: false
    }
  }
};

export default generateProblems;