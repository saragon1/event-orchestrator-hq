
import { LayoutGrid, LayoutList } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1">
      <Toggle
        pressed={view === "grid"}
        onPressedChange={() => onViewChange("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={view === "list"}
        onPressedChange={() => onViewChange("list")}
        aria-label="List view"
      >
        <LayoutList className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
