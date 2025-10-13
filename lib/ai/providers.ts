import { customProvider } from "ai"
import { isTestEnvironment } from "../constants"

export const myProvider = isTestEnvironment
  ? (() => {
      const { artifactModel, chatModel, reasoningModel, titleModel } = require("./models.mock")
      return customProvider({
        languageModels: {
          chatgpt4: chatModel,
          "gemini-dark": chatModel,
          "gemma-27b": chatModel,
          "qwen-72b": chatModel,
          grok4: chatModel,
          "gpt-oss": chatModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      })
    })()
  : customProvider({
      languageModels: {
        // These are placeholder models - actual API calls happen in the route handler
        chatgpt4: {} as any,
        "gemini-dark": {} as any,
        "gemma-27b": {} as any,
        "qwen-72b": {} as any,
        grok4: {} as any,
        "gpt-oss": {} as any,
        "title-model": {} as any,
        "artifact-model": {} as any,
      },
    })
