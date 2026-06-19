import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MessengerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const MessengerContext = createContext<MessengerContextValue | null>(null);

export function MessengerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);
  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>;
}

export function useMessengerPanel() {
  const ctx = useContext(MessengerContext);
  if (!ctx) {
    throw new Error("useMessengerPanel must be used within MessengerProvider");
  }
  return ctx;
}
