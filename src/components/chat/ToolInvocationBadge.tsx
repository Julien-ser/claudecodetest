"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function getLabel(toolName: string, args: Record<string, unknown>): string {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").pop() || path;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      default:
        return filename ? `Processing ${filename}` : toolName;
    }
  }

  if (toolName === "file_manager") {
    const newPath = typeof args.new_path === "string" ? args.new_path : "";
    const newFilename = newPath.split("/").pop() || newPath;
    switch (args.command) {
      case "delete":
        return `Deleting ${filename}`;
      case "rename":
        return `Renaming ${filename} to ${newFilename}`;
      default:
        return filename ? `Processing ${filename}` : toolName;
    }
  }

  return toolName;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isDone =
    toolInvocation.state === "result" &&
    (toolInvocation as { result?: unknown }).result != null;

  const label = getLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" data-testid="done-indicator" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="loading-indicator" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
