import { ChatCompletionTool } from "openai/resources/index.mjs";

const solveProblem: ChatCompletionTool = {
  type: "function",
  function: {
    name: "solve_problem",
    description: "Solve a math problem (text or image URL). Returns the process (logic and LaTeX) and a step list (MathJS functions, LaTeX equations, step numbers, and descriptions).",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The problem statement (plain text or LaTeX) to solve."
        },
        image_url: {
          type: "string",
          description: "Optional: a publicly accessible URL to an image of the problem if it is handwritten or typeset."
        }
      },
      required: ["question"],
      additionalProperties: false
    }
  }
};

export default solveProblem;
