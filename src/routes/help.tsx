import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bug, Lightbulb, RefreshCw, MessageSquare, X, Clock, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
}

interface KanbanComment {
  id: number;
  note_id: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

function SortableNote({ note, openNoteDetail, deleteNote, editingNote, setEditingNote, updateNote, comments, getTypeColor, getTypeIcon, formatDateTime }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-2 border ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing pt-1 flex-shrink-0"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => openNoteDetail(note.id)}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge className={`${getTypeColor(note.note_type)} border-0 flex items-center gap-1 px-1.5 py-0 text-xs`}>
              {getTypeIcon(note.note_type)}
              <span className="capitalize">{note.note_type}</span>
            </Badge>
          </div>
          {editingNote === note.id ? (
            <Input
              defaultValue={note.title}
              onBlur={(e) => updateNote(note.id, e.target.value, note.description || '')}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateNote(note.id, e.currentTarget.value, note.description || '');
                }
                if (e.key === 'Escape') {
                  setEditingNote(null);
                }
              }}
              className="text-sm h-7 px-2"
              autoFocus
            />
          ) : (
            <h4 className="text-sm font-medium mb-1 break-words cursor-pointer">
              {note.title}
            </h4>
          )}
          {note.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{note.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(note.created_at)}
              </span>
              {comments[note.id]?.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {comments[note.id].length}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            deleteNote(note.id);
          }}
          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function RouteComponent() {
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, KanbanComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    description: "",
    note_type: "issue" as const,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchNotes = async () => {
    try {
      const response = await invoke<string>("get_kanban_notes");
      setNotes(JSON.parse(response));
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const fetchComments = async (noteId: number) => {
    try {
      const response = await invoke<string>("get_kanban_comments", { noteId });
      const commentList = JSON.parse(response);
      setComments(prev => ({ ...prev, [noteId]: commentList }));
    } catch (error) {
      console.error("Failed to fetch comments:", error);
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

  const addComment = async (noteId: number) => {
    if (!newComment.trim()) return;

    try {
      await invoke("create_kanban_comment", {
        noteId,
        commentText: newComment,
      });
      setNewComment("");
      fetchComments(noteId);
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const deleteComment = async (commentId: number, noteId: number) => {
    try {
      await invoke("delete_kanban_comment", { id: commentId });
      fetchComments(noteId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeNote = notes.find(n => n.id === active.id);
    if (!activeNote) return;

    const overId = over.id as string;
    const newStatus = overId.startsWith('droppable-')
      ? overId.replace('droppable-', '')
      : notes.find(n => n.id === over.id)?.status;

    if (newStatus && activeNote.status !== newStatus) {
      try {
        await invoke("update_kanban_note_status", {
          id: activeNote.id,
          status: newStatus,
          position: 0,
        });
        fetchNotes();
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    }

    setActiveId(null);
  };

  const typeConfig = {
    issue: { color: "bg-red-50 text-red-700 border-red-200", icon: Bug },
    feature: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Lightbulb },
    request: { color: "bg-green-50 text-green-700 border-green-200", icon: RefreshCw },
  };

  const getTypeColor = (type: string) =>
    typeConfig[type as keyof typeof typeConfig]?.color || "bg-gray-50 text-gray-700 border-gray-200";

  const getTypeIcon = (type: string) => {
    const Icon = typeConfig[type as keyof typeof typeConfig]?.icon;
    return Icon ? <Icon className="h-3 w-3" /> : null;
  };

  const getColumnNotes = (status: string) =>
    notes.filter(note => note.status === status).sort((a, b) => a.position - b.position);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openNoteDetail = (noteId: number) => {
    setSelectedNote(noteId);
    fetchComments(noteId);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const selectedNoteData = notes.find(n => n.id === selectedNote);
  const activeNote = notes.find(n => n.id === activeId);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Help & Support Board</h1>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
            <Card className="w-full max-w-md shadow-2xl border-0" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Enter a title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="border-gray-300"
                  autoFocus
                />
                <textarea
                  placeholder="Add description..."
                  value={newNote.description}
                  onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background"
                />
                <select
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newNote.note_type}
                  onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
                >
                  <option value="issue">Issue</option>
                  <option value="feature">Feature</option>
                  <option value="request">Request</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <Button onClick={createNote} size="sm" disabled={!newNote.title.trim()}>Add Note</Button>
                  <Button variant="ghost" onClick={() => setShowAddForm(false)} size="sm">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedNote && selectedNoteData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNote(null)}>
            <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3 sticky top-0 bg-card z-10 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getTypeColor(selectedNoteData.note_type)} border-0 flex items-center gap-1 px-2 py-1`}>
                        {getTypeIcon(selectedNoteData.note_type)}
                        <span className="capitalize">{selectedNoteData.note_type}</span>
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{selectedNoteData.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(selectedNoteData.created_at)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedNote(null)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {selectedNoteData.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{selectedNoteData.description}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Comments</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    {comments[selectedNote]?.map((comment) => (
                      <div key={comment.id} className="bg-muted/50 p-3 rounded border flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm">{comment.comment_text}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteComment(comment.id, selectedNote)}
                          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addComment(selectedNote);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={() => addComment(selectedNote)} size="sm">Add</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full">
            {["todo", "in_progress", "done"].map((status) => {
              const columnNotes = getColumnNotes(status);
              return (
                <div key={status} className="flex-shrink-0 w-[272px] flex flex-col max-h-full">
                  <div className="bg-muted/50 rounded-lg flex flex-col max-h-full shadow-sm border">
                    <div className="px-3 py-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        {status === "todo" ? "To Do" : status === "in_progress" ? "In Progress" : "Done"}
                      </h3>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {columnNotes.length}
                      </Badge>
                    </div>
                    <SortableContext
                      id={`droppable-${status}`}
                      items={columnNotes.map(n => n.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[100px]"
                      >
                        {columnNotes.map((note) => (
                          <SortableNote
                            key={note.id}
                            note={note}
                            openNoteDetail={openNoteDetail}
                            deleteNote={deleteNote}
                            editingNote={editingNote}
                            setEditingNote={setEditingNote}
                            updateNote={updateNote}
                            comments={comments}
                            getTypeColor={getTypeColor}
                            getTypeIcon={getTypeIcon}
                            formatDateTime={formatDateTime}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeNote ? (
              <div className="bg-card rounded-lg shadow-lg p-2 border opacity-90 w-[256px]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge className={`${getTypeColor(activeNote.note_type)} border-0 flex items-center gap-1 px-1.5 py-0 text-xs`}>
                    {getTypeIcon(activeNote.note_type)}
                    <span className="capitalize">{activeNote.note_type}</span>
                  </Badge>
                </div>
                <h4 className="text-sm font-medium">{activeNote.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
