import { createFileRoute } from "@tanstack/react-router";
import Basic from "@/components/dzfilereader";

export const Route = createFileRoute("/upload-file")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center p-3 md:p-10 min-h-screen">
      <div></div>
      <Basic />
    </div>
  );
}
