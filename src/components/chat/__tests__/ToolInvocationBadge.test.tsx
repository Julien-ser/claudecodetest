import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "call",
  result?: unknown
): ToolInvocation {
  if (state === "result") {
    return { state, toolCallId: "1", toolName, args, result } as ToolInvocation;
  }
  return { state, toolCallId: "1", toolName, args } as ToolInvocation;
}

// str_replace_editor labels

test("shows 'Creating' for str_replace_editor create command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "src/components/Card.tsx",
      })}
    />
  );
  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "src/components/Card.tsx",
      })}
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "src/components/Button.tsx",
      })}
    />
  );
  expect(screen.getByText("Editing Button.tsx")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "src/components/Card.tsx",
      })}
    />
  );
  expect(screen.getByText("Reading Card.tsx")).toBeDefined();
});

// file_manager labels

test("shows 'Deleting' for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "src/components/OldCard.tsx",
      })}
    />
  );
  expect(screen.getByText("Deleting OldCard.tsx")).toBeDefined();
});

test("shows 'Renaming' for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "src/components/OldCard.tsx",
        new_path: "src/components/NewCard.tsx",
      })}
    />
  );
  expect(screen.getByText("Renaming OldCard.tsx to NewCard.tsx")).toBeDefined();
});

// Path display

test("shows only the basename of a nested path", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "src/components/ui/deep/Component.tsx",
      })}
    />
  );
  expect(screen.getByText("Creating Component.tsx")).toBeDefined();
});

// Unknown tool

test("falls back to tool name for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("some_other_tool", {})}
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

// Loading / done state indicators

test("shows loading indicator when state is 'call'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "Card.tsx",
      }, "call")}
    />
  );
  expect(screen.getByTestId("loading-indicator")).toBeDefined();
  expect(screen.queryByTestId("done-indicator")).toBeNull();
});

test("shows done indicator when state is 'result' with a result", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "Card.tsx" },
        "result",
        "Success"
      )}
    />
  );
  expect(screen.getByTestId("done-indicator")).toBeDefined();
  expect(screen.queryByTestId("loading-indicator")).toBeNull();
});

test("shows loading indicator when state is 'result' but result is null", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "Card.tsx" },
        "result",
        null
      )}
    />
  );
  expect(screen.getByTestId("loading-indicator")).toBeDefined();
});
