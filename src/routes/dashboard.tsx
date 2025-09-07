import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileUpload } from "@/components/claims/FileUpload";
import { ClaimsTable } from "@/components/claims/ClaimsTable";
import { ClaimType } from "@/types/claims";
import { Toaster } from "react-hot-toast";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const [claimsData, setClaimsData] = useState<ClaimType[]>([]);

  return (
    <div className="ml-[220px] p-6 space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-2xl font-bold mb-2">Claims Processing</h1>
        <p className="text-gray-600">Upload Excel files to process insurance claims</p>
      </div>

      {claimsData.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <FileUpload onDataParsed={setClaimsData} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Claims Data ({claimsData.length} records)
            </h2>
            <button
              onClick={() => setClaimsData([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Upload New File
            </button>
          </div>
          <ClaimsTable data={claimsData} onDataChange={setClaimsData} />
        </div>
      )}
    </div>
  );
}
