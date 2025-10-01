import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AiOutlineFileExcel } from "react-icons/ai";
import { invoke } from "@tauri-apps/api/core";
import toast from "react-hot-toast";
import { Search, MoveVertical as MoreVertical, Download, CreditCard as Edit, Delete } from "lucide-react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/documents")({
  component: RouteComponent,
});

interface Document {
  id: number;
  file_name: string;
  created_at: string;
  file_data: number[];
  is_locked?: number;
}

function RouteComponent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<string>("get_all_documents");
      const parsedDocuments: Document[] = JSON.parse(response);
      setDocuments(parsedDocuments);
      setFilteredDocuments(parsedDocuments);
    } catch (err: any) {
      const errorMsg = err?.toString() || "Failed to fetch documents. Please try again.";
      console.error("Error fetching documents:", err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: number) => {
    const downloadToastId = toast.loading("Opening file...");

    try {
      const filePath = await invoke("open_excel_from_database", {
        documentId,
      });

      toast.success("File downloaded successfully", { id: downloadToastId });
    } catch (err: any) {
      const errorMsg = err?.toString() || "Failed to open the file. Please try again.";
      console.error("Download failed:", err);
      toast.error(errorMsg, { id: downloadToastId });
    }
  };

  const handleRename = async (documentId: number, currentName: string) => {
    const newName = prompt("Enter new file name:", currentName);

    if (newName && newName.trim() !== "" && newName !== currentName) {
      const renameToastId = toast.loading("Renaming file...");

      try {
        await invoke("rename_document", {
          documentId,
          newName: newName.trim(),
        });

        const updatedDocuments = documents.map((doc) =>
          doc.id === documentId ? { ...doc, file_name: newName.trim() } : doc
        );
        setDocuments(updatedDocuments);

        const updatedFilteredDocuments = filteredDocuments.map((doc) =>
          doc.id === documentId ? { ...doc, file_name: newName.trim() } : doc
        );
        setFilteredDocuments(updatedFilteredDocuments);

        toast.success("File renamed successfully", { id: renameToastId });
      } catch (err: any) {
        const errorMsg = err?.toString() || "Failed to rename the file. Please try again.";
        console.error("Rename failed:", err);
        toast.error(errorMsg, { id: renameToastId });
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const searchTerm = query.toLowerCase().trim();
      const filtered = documents.filter((doc) => {
        // Search by file name
        const nameMatch = doc.file_name.toLowerCase().includes(searchTerm);

        // Search by formatted date
        const formattedDate = formatDate(doc.created_at).toLowerCase();
        const dateMatch = formattedDate.includes(searchTerm);

        // Search by raw date parts
        const date = new Date(doc.created_at);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const rawDateMatch =
          year.includes(searchTerm) ||
          month.includes(searchTerm) ||
          day.includes(searchTerm) ||
          `${year}-${month}-${day}`.includes(searchTerm) ||
          `${day}/${month}/${year}`.includes(searchTerm) ||
          `${month}/${day}/${year}`.includes(searchTerm);

        return nameMatch || dateMatch || rawDateMatch;
      });
      setFilteredDocuments(filtered);
    }
  };

  const formatFileSize = (bytes: number[]) => {
    const size = bytes.length;
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year

    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (documentId: number) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document?.is_locked === 1) {
      toast.error("Cannot delete: Document is locked. Documents are locked after printing to maintain audit trail.");
      return;
    }

    const toastId = toast.loading("Deleting file...");

    try {
      await invoke("delete_document", { documentId });

      const updatedDocs = documents.filter((doc) => doc.id !== documentId);
      setDocuments(updatedDocs);
      setFilteredDocuments(updatedDocs);

      toast.success("File deleted successfully", { id: toastId });
    } catch (err: any) {
      const errorMsg = err?.toString() || "Failed to delete the file";
      console.error("Delete failed:", err);
      toast.error(errorMsg, { id: toastId });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-6 border-b gap-4">
        <h1 className="text-2xl font-medium text-gray-900">My Drive</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files by name or date..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading documents...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">
              {searchQuery ? "No documents found" : "No documents uploaded yet"}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b">
              <div className="col-span-6 md:col-span-6">Name</div>
              <div className="col-span-2 md:col-span-2">Owner</div>
              <div className="col-span-2 md:col-span-2">Date uploaded</div>
              <div className="col-span-1 md:col-span-1">File size</div>
              <div className="col-span-1 md:col-span-1"></div>
            </div>

            {/* Document rows */}
            {[...filteredDocuments].reverse().map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-2 md:px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors border md:border-0 mb-2 md:mb-0"
              >
                <div className="col-span-1 md:col-span-6 flex items-center space-x-3">
                  <AiOutlineFileExcel className="text-green-600 text-xl flex-shrink-0" />
                  {doc.is_locked === 1 && (
                    <div title="Document is locked - cheques have been printed">
                      <Lock className="text-red-600 h-4 w-4 flex-shrink-0" />
                    </div>
                  )}
                  <span className="text-xs md:text-sm text-gray-900 truncate">
                    {doc.file_name}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center">
                  <span className="text-xs md:text-sm text-gray-600">System</span>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center">
                  <span className="text-xs md:text-sm text-gray-600">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 flex items-center">
                  <span className="text-xs md:text-sm text-gray-600">
                    {formatFileSize(doc.file_data)}
                  </span>
                </div>
                <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleRename(doc.id, doc.file_name)}
                        className="flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(doc.id)}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Are you sure you want to permanently delete this file?"
                          );
                          if (confirmed) {
                            handleDelete(doc.id);
                          }
                        }}
                        className="flex items-center space-x-2 text-red-600"
                      >
                        <Delete className="w-4 h-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteComponent;