import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Bug, Lightbulb, RefreshCw } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export const Route = createFileRoute("/help")({
  component: RouteComponent,
});

interface KanbanNote {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  note_type: "issue" | "feature" | "request";
  created_at: string;
  updated_at: string;
  position: number;
  isEditing?: boolean;
}

function RouteComponent() {
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
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

  const updateNote = async (id: number, title: string, description: string) => {
    try {
      await invoke("update_kanban_note", {
        id,
        title,
        description: description || null,
      });
      fetchNotes();
      setEditingNote(null);
    } catch (error) {
      console.error("Failed to update note:", error);
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
      case "issue": return "bg-red-50 text-red-700 border-red-200";
      case "feature": return "bg-blue-50 text-blue-700 border-blue-200";
      case "request": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue": return <Bug className="h-3 w-3" />;
      case "feature": return <Lightbulb className="h-3 w-3" />;
      case "request": return <RefreshCw className="h-3 w-3" />;
      default: return null;
    }
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case "todo": return "border-t-4 border-t-gray-400";
      case "in_progress": return "border-t-4 border-t-blue-400";
      case "done": return "border-t-4 border-t-green-400";
      default: return "border-t-4 border-t-gray-400";
    }
  };

  const getColumnNotes = (status: string) => 
    notes.filter(note => note.status === status).sort((a, b) => a.position - b.position);

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="p-3 md:p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-1">Track issues, features, and updates</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Create New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="border-gray-200 focus:border-blue-500"
            />
            <Input
              placeholder="Description (optional)"
              value={newNote.description}
              onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
              className="focus:border-primary"
            />
            <select
              className="border rounded-md px-3 py-2 w-full bg-background focus:border-primary focus:outline-none"
              value={newNote.note_type}
              onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
            >
              <option value="issue">Issue</option>
              <option value="feature">Feature</option>
              <option value="request">Request</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={createNote}>Create</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["todo", "in_progress", "done"].map((status) => (
            <Card key={status} className={`shadow-lg border-0 ${getColumnColor(status)}`}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
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
                      className="space-y-3 min-h-[300px]"
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
                              className={`p-4 rounded-lg bg-card shadow-md border hover:shadow-lg transition-all duration-150 ${
                                note.status === "done" ? "opacity-70" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-grab transition-colors duration-150" />
                                    </div>
                                    <Badge className={`${getTypeColor(note.note_type)} border flex items-center gap-1 px-2 py-1 transition-colors duration-150`}>
                                      {getTypeIcon(note.note_type)}
                                      {note.note_type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {editingNote === note.id ? (
                                    <div className="space-y-2">
                                      <Input
                                        defaultValue={note.title}
                                        onBlur={(e) => updateNote(note.id, e.target.value, note.description || '')}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateNote(note.id, e.currentTarget.value, note.description || '');
                                          }
                                        }}
                                        className="text-sm"
                                      />
                                    </div>
                                  ) : (
                                    <h3 
                                      className="font-semibold text-sm mb-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                                      onClick={() => setEditingNote(note.id)}
                                    >{note.title}</h3>
                                  )}
                                  {note.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">{note.description}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNote(note.id)}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                                >
                                  <Trash2 className="h-4 w-4" />
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