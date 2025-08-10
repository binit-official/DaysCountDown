import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit2, Trash2, Plus, StickyNote } from "lucide-react";

interface Note {
  id: string;
  text: string;
  createdAt: Timestamp;
}

export const StickyNotes: React.FC = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const notesRef = collection(db, "users", user.uid, "notes");
    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      setNotes(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Note),
        }))
      );
    });
    return () => unsubscribe();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
        setNewNote("");
        setEditingId(null);
        setEditingText("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  const handleAddNote = async () => {
    if (!user || !newNote.trim()) return;
    const notesRef = collection(db, "users", user.uid, "notes");
    await addDoc(notesRef, {
      text: newNote.trim(),
      createdAt: Timestamp.now(),
    });
    setNewNote("");
  };

  const handleEditNote = async (id: string) => {
    if (!user || !editingText.trim()) return;
    const noteRef = doc(db, "users", user.uid, "notes", id);
    await updateDoc(noteRef, { text: editingText.trim() });
    setEditingId(null);
    setEditingText("");
  };

  const handleDeleteNote = async (id: string) => {
    if (!user) return;
    const noteRef = doc(db, "users", user.uid, "notes", id);
    await deleteDoc(noteRef);
  };

  // Bubble style for theme adaptation
  const parentBubbleClass =
    "bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center";

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-4"
    >
      <AnimatePresence>
        {!expanded && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          >
            <Button
              size="icon"
              className={parentBubbleClass}
              onClick={() => setExpanded(true)}
              aria-label="Open Sticky Notes"
            >
              <StickyNote className="h-7 w-7 text-white drop-shadow" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col gap-2 items-end"
          >
            {/* Add new note bubble */}
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex items-center gap-2"
            >
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add sticky note..."
                className="bg-yellow-50 text-yellow-900 border-none outline-none rounded-lg"
              />
              <Button size="icon" variant="ghost" onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="w-5 h-5 text-yellow-700" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setExpanded(false); setNewNote(""); }}>
                <X className="w-5 h-5 text-yellow-700" />
              </Button>
            </motion.div>
            {/* Existing notes as bubbles */}
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="p-3 rounded-xl shadow-lg bg-yellow-100 border-2 border-yellow-400 flex items-center gap-2 min-w-[200px]"
              >
                {editingId === note.id ? (
                  <>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="bg-yellow-50 text-yellow-900 border-none outline-none rounded-lg"
                      rows={2}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleEditNote(note.id)}>
                      <Edit2 className="w-4 h-4 text-green-700" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setEditingText(""); }}>
                      <X className="w-4 h-4 text-red-700" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-yellow-900">{note.text}</span>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(note.id); setEditingText(note.text); }}>
                      <Edit2 className="w-4 h-4 text-blue-700" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="w-4 h-4 text-red-700" />
                    </Button>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
