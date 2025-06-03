/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatCompletionTool } from "openai/resources/index.mjs";
import generateProblems from "./function-calling-tools/generateProblems";
import solveProblem from "./function-calling-tools/solveProblem";
import validateSolution from "./function-calling-tools/validateSolution";

const functionCallingTools: ChatCompletionTool[] = [
  generateProblems,
  solveProblem,
  validateSolution,
]

export default functionCallingTools;