export const DEFAULT_CHAT_MODEL: string = "chatgpt4"

export type ChatModel = {
  id: string
  name: string
  description: string
  apiEndpoint: string
}

export const chatModels: ChatModel[] = [
  {
    id: "chatgpt4",
    name: "ChatGPT-4",
    description: "Best AI model with advanced reasoning capabilities",
    apiEndpoint: "https://shahad.top/chatbotapi.php",
  },
  {
    id: "gemini-dark",
    name: "Gemini Dark",
    description: "Google's advanced Gemini model",
    apiEndpoint: "https://sii3.top/api/gemini-dark.php",
  },
  {
    id: "gemma-27b",
    name: "Gemma 27B",
    description: "Powerful open-source language model",
    apiEndpoint: "https://sii3.top/api/gemma.php",
  },
  {
    id: "qwen-72b",
    name: "Qwen 2.5 72B",
    description: "Advanced multilingual model",
    apiEndpoint: "https://sii3.top/api/qwen.php",
  },
  {
    id: "grok4",
    name: "Grok 4",
    description: "Fast and efficient AI model",
    apiEndpoint: "https://sii3.top/api/grok4.php",
  },
  {
    id: "gpt-oss",
    name: "GPT OSS",
    description: "Open-source GPT implementation",
    apiEndpoint: "https://sii3.top/api/gpt-oss.php",
  },
]
