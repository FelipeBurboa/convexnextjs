import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserNotes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return notes;
  },
});

export const createNote = mutation({
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
    return await ctx.db.insert("notes", {
      title: args.title,
      body: args.body,
      userId: userId,
    });
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("El usuario no está autenticado");
    }

    const note = await ctx.db.get(args.noteId);

    if (!note) {
      throw new Error("Nota no encontrada");
    }

    if (note.userId !== userId) {
      throw new Error("El usuario no está autorizado para borrar esta nota");
    }

    await ctx.db.delete(args.noteId);
  },
});
