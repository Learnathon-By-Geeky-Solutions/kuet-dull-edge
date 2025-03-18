"use client"; // Mark as a Client Component

import { useState, useEffect } from "react";
// import Sidebar from "@/components/Sidebar";
import NoteEditor from "@/components/NoteEditor";
import { getNotes, getNoteById, saveNote, updateNote} from "@/lib/storage";

// Define the Note type
interface Note {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

//   console.log(typeof(notes[0]?._id))

  // Fetch all notes on component mount
  useEffect(() => {
    async function fetchNotes() {
      const notes = await getNotes();
      setNotes(notes);
    }
    fetchNotes();
  }, []);

  // Handle note selection
  const handleNoteSelect = async (id: string) => {
    const note = await getNoteById(id.toString());
    setSelectedNote(note || null);
  };

  // Handle creating a new note
  const handleNewNote = async () => {
    const newNote = { title: "Untitled Note", content: "" };
    const savedNote = await saveNote(newNote);
    if (savedNote) {
      setNotes([...notes, savedNote]);
      setSelectedNote(savedNote);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <button
          onClick={handleNewNote}
          className="w-full p-2 mb-4 bg-blue-500 text-white rounded"
        >
          New Note
        </button>
        <ul>
          {notes.map((note) => (
            <li
              key={note._id}
              onClick={() => handleNoteSelect(note._id)}
              className={`p-2 mb-2 cursor-pointer ${
                selectedNote?._id === note._id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {note.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Right Pane */}
      <div className="flex-1 p-4">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote._id} // Force re-render when note changes
            initialContent={selectedNote.content}
            onSave={async (content) => {
              const updatedNote = { ...selectedNote, content };
              await updateNote(updatedNote);
              setSelectedNote(updatedNote);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a note to start editing
          </div>
        )}
      </div>
    </div>
  );
}
