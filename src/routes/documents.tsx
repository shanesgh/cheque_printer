import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AiOutlineFileExcel } from "react-icons/ai";
import { invoke } from "@tauri-apps/api/core";
import toast, { Toaster } from "react-hot-toast"; // Import React Hot Toast
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/documents")({
  component: RouteComponent,
});

function RouteComponent() {
  const [documents, setDocuments] = useState<
    { id: number; file_name: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<string>("get_all_documents");
      const parsedDocuments: {
        id: number;
        file_name: string;
        created_at: string;
      }[] = JSON.parse(response);

      setDocuments(parsedDocuments);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to fetch documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //TO REMOVE PERMAMNENTLY IN PROD
  const handleDelete = async () => {
    try {
      const response: string = await invoke("delete_all_documents");
      console.log(response); // Logs success message
      setDocuments([]);
    } catch (error) {
      console.error("Failed to delete documents:", error);
      alert("An error occurred while deleting documents.");
    }
  };

  const handleDownload = async (documentId: number) => {
    const downloadToastId = toast.loading("Downloading..."); // Show a "loading" toast

    try {
      const filePath: string = await invoke("get_document_file", {
        documentId,
      });

      const link = document.createElement("a");
      link.href = `file://${filePath}`;
      link.download = filePath.split("/").pop() || "downloaded-file";
      link.click();

      // Update toast to success message
      toast.success("File downloaded successfully!", { id: downloadToastId });
    } catch (err) {
      console.error("Download failed:", err);

      // Update toast to error message
      toast.error("Failed to download the file. Please try again.", {
        id: downloadToastId,
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="ml-[220px] flex justify-between p-10 max-h-screen max-w-screen">
      {/* Toast Notification Container */}
      <Toaster position="top-right" reverseOrder={false} />
      <div className="w-full">
        <h1 className="text-xl font-bold mb-4">DOCUMENTS</h1>
        <Button onClick={handleDelete}>Delete</Button>
        <div className="grid grid-cols-[50px_auto_auto] gap-4 text-gray-600 font-semibold border-b pb-2">
          <div className="text-center">Icon</div>
          <div>Name</div>
          <div>Created At</div>
        </div>
        {loading ? (
          <p>Loading documents...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul>
            {documents.map((doc) => (
              <li
                key={doc.id}
                onClick={() => handleDownload(doc.id)}
                className="grid grid-cols-[50px_auto_auto] gap-4 items-center border-b py-2 hover:bg-gray-100 cursor-pointer transition"
              >
                <div className="text-center hover:scale-105 transition">
                  <AiOutlineFileExcel className="text-green-500 text-xl" />
                </div>
                <p className="text-base">{doc.file_name}</p>
                <p className="text-base text-gray-500">
                  {new Date(doc.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RouteComponent;
