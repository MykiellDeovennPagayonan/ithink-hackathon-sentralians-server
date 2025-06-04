import { ChatCompletionTool } from "openai/resources/index.mjs";

const validateSolution: ChatCompletionTool = {
  type: "function",
  function: {
    name: "validate_solution",
    description: "Returns the validation outcome for a student’s solution. Includes the logical process (mix of words and LaTeX, without numeric substitution), an array indicating where the student went wrong, and a list of steps formatted for MathJS (with LaTeX, step count, and description).",
    parameters: {
      type: "object",
      properties: {
        process: {
          type: "string",
          description: "Natural-language description of the entire solution’s logic, interspersed with LaTeX expressions (no actual numeric values)."
        },
        where_wrong: {
          type: "array",
          description: "List of strings describing each incorrect step or misconception (e.g., ‘Incorrect variable substitution in step 2’).",
          items: {
            type: "string"
          }
        },
        steps: {
          type: "array",
          description: "Sequence of step objects, each containing a MathJS-compatible expression, its LaTeX form, step number, and a brief description.",
          items: {
            type: "object",
            properties: {
              mathjs: {
                type: "string",
                description: "A MathJS expression (generic, with symbolic variables) for this step."
              },
              latex: {
                type: "string",
                description: "LaTeX representation of the same expression (with symbolic variables)."
              },
              step_number: {
                type: "integer",
                description: "Index of this step in the overall solution (starting at 1)."
              },
              description: {
                type: "string",
                description: "Natural-language explanation of what this step does (no numeric evaluation)."
              }
            },
            required: ["mathjs", "latex", "step_number", "description"],
            additionalProperties: false
          }
        }
      },
      required: ["process", "where_wrong", "steps"],
      additionalProperties: false
    }
  }
};

export default validateSolution;
