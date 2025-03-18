"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Toolbar from "./Toolbar";
import { useEffect } from "react";

interface NoteEditorProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
}

export default function NoteEditor({
  initialContent,
  onSave,
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || "<p>Start writing your note here...</p>",
  });

  // Save note when the content changes
  const handleSave = async () => {
    if (!editor) return;
    const content = editor.getHTML();
    await onSave(content);
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!editor) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [editor?.getHTML()]);

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
