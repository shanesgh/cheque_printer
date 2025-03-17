import { createFileRoute } from "@tanstack/react-router";
import Basic from "@/components/dzfilereader";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="ml-[220px] flex justify-between p-10 max-h-screen max-w-screen">
      <div></div>
      <Basic />
    </div>
  );
}
