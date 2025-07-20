"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useSearchParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface NotePreviewDialogProps {
  note: Doc<"notes">;
}

export function NotePreviewDialog({ note }: NotePreviewDialogProps) {
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("noteId") === note._id;
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteNote = useMutation(api.notes.deleteNote);

  function handleClose() {
    if (isDeleting) return;
    window.history.pushState(null, "", window.location.pathname);
  }

  async function handleDeleteNote() {
    setIsDeleting(true);
    try {
      await deleteNote({ noteId: note._id });
      toast.success("Nota borrada correctamente");
      handleClose();
    } catch (error) {
      console.error("Error al borrar la nota:", error);
      toast.error("Error al borrar la nota, intente nuevamente");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 whitespace-pre-wrap">{note.body}</div>
        <DialogFooter className="mt-6">
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleDeleteNote}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? "Borrando..." : "Borrar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
