import { createFileRoute } from "@tanstack/react-router";
import Basic from "@/components/dzfilereader";

export const Route = createFileRoute("/upload-file")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-10 min-h-screen">
      <div className="w-full max-w-4xl">
        <Basic />
      </div>
    </div>
  );
}
