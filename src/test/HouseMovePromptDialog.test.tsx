// HouseMovePromptDialog — render tests. Verifies the dialog renders the
// move-prompt copy and exposes both action buttons. Mirrors the
// boundary-level test pattern in src/test/roleManagerTabs.test.tsx.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HouseMovePromptDialog, type HouseMoveEntry } from "@/components/role-manager/HouseMovePromptDialog";

// jsdom doesn't implement ResizeObserver/DOMRect for Radix Popper; stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;
if (!("IntersectionObserver" in globalThis)) {
  (globalThis as any).IntersectionObserver = ResizeObserverStub;
}

const singleMove: HouseMoveEntry[] = [
  { staffId: "s1", staffName: "Alice Sharma", fromHouse: "Blue", toHouse: "Red", role: "incharge" },
];

const multiMoves: HouseMoveEntry[] = [
  { staffId: "s1", staffName: "Alice Sharma", fromHouse: "Blue", toHouse: "Red", role: "incharge" },
  { staffId: "s2", staffName: "Bob Verma", fromHouse: "Green", toHouse: "Yellow", role: "staff" },
];

describe("HouseMovePromptDialog", () => {
  it("renders the single-move inline copy and both action buttons", () => {
    const onConfirm = vi.fn();
    render(
      <HouseMovePromptDialog open onOpenChange={vi.fn()} moves={singleMove} onConfirm={onConfirm} />
    );
    expect(screen.getByText("Move Staff Between Houses")).toBeInTheDocument();
    expect(screen.getByText(/Alice Sharma/)).toBeInTheDocument();
    expect(screen.getByText(/Blue/)).toBeInTheDocument();
    expect(screen.getByText(/Red/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move staff/i })).toBeInTheDocument();
  });

  it("renders the multi-move list with role annotation and from → to lines", () => {
    render(
      <HouseMovePromptDialog open onOpenChange={vi.fn()} moves={multiMoves} onConfirm={vi.fn()} />
    );
    expect(screen.getByText("Move 2 Staff Between Houses")).toBeInTheDocument();
    expect(screen.getByText(/Alice Sharma/)).toBeInTheDocument();
    expect(screen.getByText(/incharge/)).toBeInTheDocument();
    expect(screen.getByText(/Bob Verma/)).toBeInTheDocument();
    // "staff" appears in the list item annotation "(staff):" — match in that context only.
    expect(screen.getByText(/\(staff\)/)).toBeInTheDocument();
  });

  it("fires onConfirm when Move Staff is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <HouseMovePromptDialog open onOpenChange={vi.fn()} moves={singleMove} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByRole("button", { name: /move staff/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not render the dialog content when open is false", () => {
    render(
      <HouseMovePromptDialog open={false} onOpenChange={vi.fn()} moves={singleMove} onConfirm={vi.fn()} />
    );
    expect(screen.queryByText("Move Staff Between Houses")).not.toBeInTheDocument();
  });
});
