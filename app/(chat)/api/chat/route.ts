import { createUIMessageStream, JsonToSseTransformStream } from "ai"
import { unstable_cache as cache } from "next/cache"
import type { ModelCatalog } from "tokenlens/core"
import { fetchModels } from "tokenlens/fetch"
import type { VisibilityType } from "@/components/visibility-selector"
import { chatModels, type ChatModel } from "@/lib/ai/models"
import { callCustomAPI, callOCRAPI } from "@/lib/ai/custom-api-client"
import {
  createStreamId,
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries"
import { ChatSDKError } from "@/lib/errors"
import type { ChatMessage } from "@/lib/types"
import type { AppUsage } from "@/lib/usage"
import { convertToUIMessages, generateUUID } from "@/lib/utils"
import { generateTitleFromUserMessage } from "../../actions"
import { type PostRequestBody, postRequestBodySchema } from "./schema"

export const maxDuration = 60

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels()
    } catch (err) {
      console.warn("TokenLens: catalog fetch failed, using default catalog", err)
      return // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 }, // 24 hours
)

export function getStreamContext() {
  return null
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse()
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string
      message: ChatMessage
      selectedChatModel: ChatModel["id"]
      selectedVisibilityType: VisibilityType
    } = requestBody

    const chat = await getChatById({ id })

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      })

      await saveChat({
        id,
        userId: "anonymous", // Use anonymous user
        title,
        visibility: selectedVisibilityType,
      })
    }

    const messagesFromDb = await getChatById({ id }).then((c) => c?.messages || [])
    const uiMessages = [...convertToUIMessages(messagesFromDb), message]

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: "user",
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    })

    const streamId = generateUUID()
    await createStreamId({ streamId, chatId: id })

    const selectedModel = chatModels.find((m) => m.id === selectedChatModel)
    if (!selectedModel) {
      return new ChatSDKError("bad_request:api").toResponse()
    }

    let userPrompt = ""
    let hasImage = false
    let imageUrl = ""

    for (const part of message.parts) {
      if (part.type === "text") {
        userPrompt += part.text
      } else if (part.type === "file" && part.mediaType?.startsWith("image/")) {
        hasImage = true
        imageUrl = part.url
      }
    }

    let finalMergedUsage: AppUsage | undefined

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        try {
          let responseText = ""

          if (hasImage && imageUrl) {
            responseText = await callOCRAPI(imageUrl, userPrompt || "describe this picture")
          } else {
            // Build conversation history for context
            const conversationMessages = uiMessages.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content:
                msg.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as any).text)
                  .join("\n") || "",
            }))

            responseText = await callCustomAPI(selectedModel, conversationMessages)
          }

          // Stream the response
          const assistantMessageId = generateUUID()

          dataStream.write({
            type: "message-start",
            data: {
              id: assistantMessageId,
              role: "assistant",
            },
          })

          dataStream.write({
            type: "text-delta",
            data: {
              textDelta: responseText,
            },
          })

          dataStream.write({
            type: "message-finish",
            data: {
              id: assistantMessageId,
              role: "assistant",
            },
          })

          // Save assistant message
          await saveMessages({
            messages: [
              {
                id: assistantMessageId,
                role: "assistant",
                parts: [{ type: "text", text: responseText }],
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              },
            ],
          })

          finalMergedUsage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          }

          dataStream.write({ type: "data-usage", data: finalMergedUsage })
        } catch (error) {
          console.error("Error in custom API call:", error)
          dataStream.write({
            type: "error",
            data: {
              error: "Failed to get response from AI model",
            },
          })
        }
      },
      generateId: generateUUID,
      onFinish: async () => {
        if (finalMergedUsage) {
          try {
            await updateChatLastContextById({
              chatId: id,
              context: finalMergedUsage,
            })
          } catch (err) {
            console.warn("Unable to persist last usage for chat", id, err)
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!"
      },
    })

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()))
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id")

    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }

    console.error("Unhandled error in chat API:", error, { vercelId })
    return new ChatSDKError("offline:chat").toResponse()
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse()
  }

  const chat = await getChatById({ id })

  if (!chat) {
    return new ChatSDKError("forbidden:chat").toResponse()
  }

  const deletedChat = await deleteChatById({ id })

  return Response.json(deletedChat, { status: 200 })
}
