import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("groq/llama-3.3-70b-versatile"),
        "chat-model-reasoning": gateway.languageModel("groq/llama-3.3-70b-versatile"),
        "title-model": gateway.languageModel("groq/llama-3.3-70b-versatile"),
        "artifact-model": gateway.languageModel("groq/llama-3.3-70b-versatile"),
      },
    });
