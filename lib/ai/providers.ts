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
        "chat-model": gateway.languageModel("meta/llama-3.1-8b"),
        "chat-model-reasoning": gateway.languageModel("meta/llama-3.1-8b"),
        "title-model": gateway.languageModel("meta/llama-3.1-8b"),
        "artifact-model": gateway.languageModel("meta/llama-3.1-8b"),
      },
    });
