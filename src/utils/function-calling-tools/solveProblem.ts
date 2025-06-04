import { ChatCompletionTool } from "openai/resources/index.mjs";

const solveProblem: ChatCompletionTool = {
  type: "function",
  function: {
    name: "solve_problem",
    description: "Returns the full solution process for a given question (text or image). Includes logical reasoning with LaTeX (no numeric substitution) and a list of steps formatted for MathJS (with LaTeX, step count, and description).",
    parameters: {
      type: "object",
      properties: {
        process: {
          type: "string",
          description: "Natural-language explanation of the solution’s logic, interwoven with LaTeX expressions (without numeric values)."
        },
        steps: {
          type: "array",
          description: "Sequence of step objects for MathJS, each containing a MathJS expression, its LaTeX form, step number, and a plain-language description.",
          items: {
            type: "object",
            properties: {
              mathjs: {
                type: "string",
                description: "A MathJS-compatible expression (using symbolic variables only)."
              },
              latex: {
                type: "string",
                description: "LaTeX representation of that symbolic expression."
              },
              step_number: {
                type: "integer",
                description: "Index of the step in the overall solution."
              },
              description: {
                type: "string",
                description: "Plain-language explanation of what happens in this step (no numeric substitution)."
              }
            },
            required: ["mathjs", "latex", "step_number", "description"],
            additionalProperties: false
          }
        }
      },
      required: ["process", "steps"],
      additionalProperties: false
    }
  }
};

export default solveProblem;
