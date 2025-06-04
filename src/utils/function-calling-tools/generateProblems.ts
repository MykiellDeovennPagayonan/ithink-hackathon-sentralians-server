import { ChatCompletionTool } from "openai/resources/index.mjs";

const generateProblems: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_problems",
    description: "Returns a list of newly generated math problems. Each problem object includes its difficulty level, topic tag, and the problem statement in LaTeX.",
    parameters: {
      type: "object",
      properties: {
        problems: {
          type: "array",
          description: "Array of generated problem objects. Each entry has difficulty, topic, and LaTeX text.",
          items: {
            type: "object",
            properties: {
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
                description: "Difficulty rating of this problem."
              },
              topic: {
                type: "string",
                description: "The topic or category this problem belongs to."
              },
              problem_latex: {
                type: "string",
                description: "The full problem statement formatted in LaTeX."
              }
            },
            required: ["difficulty", "topic", "problem_latex"],
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
