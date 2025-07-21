import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { internal } from "./_generated/api";
import { tool } from "ai";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const lastMessages = messages.slice(-10);

    const result = streamText({
      model: openai("gpt-4o"),
      stopWhen: stepCountIs(5),
      system: `
You are a helpful assistant that can search through the user's notes to answer their questions.

IMPORTANT: When a user asks about ANY information that could be stored in notes (passwords, projects, tasks, people, etc.), you MUST use the findRelevantNotes tool FIRST before responding.

RESPONSE LANGUAGE: Always respond to the user in Spanish.

TOOL USAGE:
- ALWAYS use the findRelevantNotes tool when users ask questions about their information
- Extract relevant keywords from the user's question to search effectively
- Search thoroughly before concluding information doesn't exist
- Include relevant information from the found notes in your Spanish responses
- Provide context and insights based on the note content

RESPONSE GUIDELINES:
- Always respond in Spanish, regardless of the user's question language
- Use markdown formatting (links, bullets, numbered lists, bold text)
- Provide links to relevant notes using this structure: '/notes?noteId=<note-id>'
- Keep responses concise and helpful
- Only say "Lo siento, no puedo encontrar esa información en tus notas" if the tool returns no results

EXAMPLES:
- User asks about a project → Search for project-related notes and summarize findings in Spanish
- User asks for reminders → Search for reminder/task notes and list them in Spanish
- User asks about a person → Search for notes mentioning that person and provide relevant details in Spanish
- User asks about passwords → Search for password-related notes (while reminding about security)
      `,
      messages: convertToModelMessages(lastMessages),
      tools: {
        findRelevantNotes: tool({
          description:
            "Search for relevant notes in the user's database based on their query. Use this tool whenever the user asks questions about their notes, projects, tasks, or any information they might have stored.",
          parameters: z.object({
            query: z
              .string()
              .describe(
                "The search query extracted from the user's question. Include relevant keywords and terms."
              ),
          }),
          execute: async ({ query }) => {
            console.log("🔍 findRelevantNotes called with query:", query);

            try {
              const relevantNotes = await ctx.runAction(
                internal.notesActions.findRelevantNotes,
                {
                  query,
                  userId,
                }
              );

              console.log("📝 Found notes:", relevantNotes.length);
              console.log(
                "📋 Notes titles:",
                relevantNotes.map((n) => n.title)
              );

              const result = relevantNotes.map((note) => ({
                id: note._id,
                title: note.title,
                body: note.body,
                creationTime: note._creationTime,
              }));

              console.log("✅ Returning notes to model:", result.length);
              return result;
            } catch (error) {
              console.error("❌ Error in findRelevantNotes:", error);
              throw error;
            }
          },
        }),
      },
      onStepFinish({ text, toolCalls, toolResults, finishReason }) {
        console.log(`📊 Step finished:`, {
          text: text?.substring(0, 100) + "...",
          toolCallsCount: toolCalls.length,
          toolResultsCount: toolResults.length,
          finishReason,
          toolNames: toolCalls.map((tc) => tc.toolName),
        });
      },
      onError(error) {
        console.error("streamText error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        Vary: "origin",
      }),
    });
  }),
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;
