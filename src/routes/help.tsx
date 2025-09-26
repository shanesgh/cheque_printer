import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export const Route = createFileRoute("/help")({
  component: RouteComponent,
});

interface KanbanNote {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  note_type: "issue" | "feature" | "update";
  created_at: string;
  updated_at: string;
  position: number;
}

function RouteComponent() {
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
    note_type: "issue" as const,
  });

  const fetchNotes = async () => {
    try {
      const response = await invoke<string>("get_kanban_notes");
      setNotes(JSON.parse(response));
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) return;
    
    try {
      await invoke("create_kanban_note", {
        title: newNote.title,
        description: newNote.description || null,
        noteType: newNote.note_type,
      });
      
      setNewNote({ title: "", description: "", note_type: "issue" });
      setShowAddForm(false);
      fetchNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await invoke("delete_kanban_note", { id });
      fetchNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const noteId = parseInt(result.draggableId);
    
    if (source.droppableId !== destination.droppableId) {
      try {
        await invoke("update_kanban_note_status", {
          id: noteId,
          status: destination.droppableId,
          position: destination.index,
        });
        fetchNotes();
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "issue": return "bg-red-100 text-red-800";
      case "feature": return "bg-blue-100 text-blue-800";
      case "update": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getColumnNotes = (status: string) => 
    notes.filter(note => note.status === status).sort((a, b) => a.position - b.position);

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <Input
              placeholder="Description (optional)"
              value={newNote.description}
              onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
            />
            <select
              className="border rounded px-3 py-2 w-full"
              value={newNote.note_type}
              onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
            >
              <option value="issue">Issue</option>
              <option value="feature">Feature</option>
              <option value="update">Update</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createNote}>Add</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["todo", "in_progress", "done"].map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {status === "todo" ? "To Do" : status === "in_progress" ? "In Progress" : "Done"}
                  <Badge variant="secondary" className="ml-2">
                    {getColumnNotes(status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3 min-h-[200px]"
                    >
                      {getColumnNotes(status).map((note, index) => (
                        <Draggable
                          key={note.id}
                          draggableId={note.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 border rounded-lg bg-white shadow-sm ${
                                note.status === "done" ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <Badge className={getTypeColor(note.note_type)}>
                                      {note.note_type}
                                    </Badge>
                                  </div>
                                  <h3 className="font-medium text-sm mb-1">{note.title}</h3>
                                  {note.description && (
                                    <p className="text-xs text-gray-600">{note.description}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNote(note.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}