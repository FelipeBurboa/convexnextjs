"use node";
//Usamos use node para que se ejecute en el servidor
//Todo lo que llame una API en nodejs debe usar use node, en este caso

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { generateEmbedding, generateEmbeddings } from "../src/lib/embeddings";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

export const createNote = action({
  args: {
    title: v.string(),
    body: v.string(),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("El usuario no está autenticado");
    }

    const text = `${args.title}\n\n${args.body}`;
    const embeddings = await generateEmbeddings(text);

    const noteId: Id<"notes"> = await ctx.runMutation(
      internal.notes.createNoteWithEmbeddings,
      {
        title: args.title,
        body: args.body,
        userId,
        embeddings,
      }
    );

    return noteId;
  },
});

//Usamos internalAction para que se ejecute en el servidor, no en el cliente.
export const findRelevantNotes = internalAction({
  args: {
    query: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<Array<Doc<"notes">>> => {
    const embedding = await generateEmbedding(args.query);

    const results = await ctx.vectorSearch("noteEmbeddings", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq("userId", args.userId),
    });

    console.log("vector search results:", results);

    const resultsAboveThreshold = results.filter(
      (result) => result._score > 0.3
    );

    const embeddingIds = resultsAboveThreshold.map((result) => result._id);

    const notes = await ctx.runQuery(internal.notes.fetchNotesByEmbeddingIds, {
      embeddingIds,
    });

    return notes;
  },
});
