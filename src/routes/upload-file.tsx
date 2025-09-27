import { createFileRoute } from "@tanstack/react-router";
import Basic from "@/components/dzfilereader";

export const Route = createFileRoute("/upload-file")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full p-3 md:p-6">
      <Basic />
    </div>
  );
}
