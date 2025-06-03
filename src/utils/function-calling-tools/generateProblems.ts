import { ChatCompletionTool } from "openai/resources/index.mjs";

const generateProblems: ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_problems",
    description: "Generate a list of new math problems based on a reference question or topic. Returns an array where each entry has difficulty, topic, and the problem statement in LaTeX.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "High‐level topic (e.g., 'integration by parts')."
        },
        reference_question: {
          type: "string",
          description: "A sample problem (in plain text or LaTeX) to base new problems on. If provided, this takes priority over topic."
        },
        num_questions: {
          type: "integer",
          description: "Number of distinct problems to generate."
        }
      },
      required: ["topic", "reference_question", "num_questions"],
      additionalProperties: false
    }
  }
};

export default generateProblems;
