
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyPlaceholder({
  title,
  description,
  icon,
  className,
  action,
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      {icon && <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">{icon}</div>}
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
