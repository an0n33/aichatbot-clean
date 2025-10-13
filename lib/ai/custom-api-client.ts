import type { ChatModel } from "./models"

export interface CustomAPIMessage {
  role: "user" | "assistant"
  content: string
}

export async function callCustomAPI(model: ChatModel, messages: CustomAPIMessage[]): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  const userPrompt = lastMessage.content

  try {
    switch (model.id) {
      case "chatgpt4": {
        // ChatGPT-4 API with CORS bypass
        const response = await fetch(`${model.apiEndpoint}?q=${encodeURIComponent(userPrompt)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        const text = await response.text()
        return text
      }

      case "gemini-dark": {
        const response = await fetch(model.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "gemini-deep": userPrompt,
          }),
        })
        const data = await response.json()
        return data.response || data.text || JSON.stringify(data)
      }

      case "gemma-27b": {
        const formData = new URLSearchParams()
        formData.append("27b", userPrompt)

        const response = await fetch(model.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        })
        const data = await response.json()
        return data.response || data.text || JSON.stringify(data)
      }

      case "qwen-72b": {
        const formData = new URLSearchParams()
        formData.append("prompt", userPrompt)
        formData.append("model", "qwen2.5-72b-chat")

        const response = await fetch(model.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        })
        const data = await response.json()
        return data.response || data.text || JSON.stringify(data)
      }

      case "grok4": {
        const formData = new URLSearchParams()
        formData.append("text", userPrompt)

        const response = await fetch(model.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        })
        const data = await response.json()
        return data.response || data.text || JSON.stringify(data)
      }

      case "gpt-oss": {
        const response = await fetch(model.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: userPrompt,
          }),
        })
        const data = await response.json()
        return data.response || data.text || JSON.stringify(data)
      }

      default:
        throw new Error(`Unknown model: ${model.id}`)
    }
  } catch (error) {
    console.error(`Error calling ${model.name}:`, error)
    throw error
  }
}

export async function callOCRAPI(imageUrl: string, prompt = "describe this picture"): Promise<string> {
  try {
    const response = await fetch(
      `https://sii3.top/api/OCR.php?text=${encodeURIComponent(prompt)}&link=${encodeURIComponent(imageUrl)}`,
      {
        method: "GET",
      },
    )
    const data = await response.json()
    return data.response || data.text || JSON.stringify(data)
  } catch (error) {
    console.error("Error calling OCR API:", error)
    throw error
  }
}
