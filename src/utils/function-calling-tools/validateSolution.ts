import { ChatCompletionTool } from "openai/resources/index.mjs";

const validateSolution: ChatCompletionTool = {
  type: "function",
  function: {
    name: "validate_solution",
    description: "Validate a student’s solution (provided as an image URL) against the given question. Returns the process (logic and LaTeX), an array of where the student went wrong, and a step list (with MathJS expressions, LaTeX equations, step numbers, and descriptions).",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The problem statement (plain text or LaTeX) that the student solved."
        },
        image_url: {
          type: "string",
          description: "A publicly accessible URL to an image of the student’s written solution."
        }
      },
      required: ["question", "image_url"],
      additionalProperties: false
    }
  }
};

export default validateSolution;
