interface Note {
  _id: string;
  title: string;
  content: string;
  tags?: string[];
}

const API_BASE_URL = "http://localhost:5000";

/**
 * Fetch all notes from the backend.
 */
export async function getNotes(): Promise<Note[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`);
    if (!response.ok) {
      throw new Error("Failed to fetch notes");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
}

/**
 * Fetch a single note by ID from the backend.
 */
export async function getNoteById(id: string): Promise<Note | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch note");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching note:", error);
    return undefined;
  }
}

/**
 * Save a new note to the backend.
 */
export async function saveNote(
  note: Omit<Note, "_id">
): Promise<Note | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      throw new Error("Failed to save note");
    }
    return await response.json();
  } catch (error) {
    console.error("Error saving note:", error);
    return undefined;
  }
}

/**
 * Update an existing note on the backend.
 */
export async function updateNote(note: Note): Promise<Note | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${note._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      throw new Error("Failed to update note");
    }
    return await response.json();
  } catch (error) {
    console.error("Error updating note:", error);
    return undefined;
  }
}

/**
 * Delete a note by ID from the backend.
 */
export async function deleteNote(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete note");
    }
    return true;
  } catch (error) {
    console.error("Error deleting note:", error);
    return false;
  }
}
