import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  variant?: "pill" | "icon" | "floating";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  variant = "pill",
  className = "",
  showLabel = true,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-5 right-5 z-40 ${className}`}>
        <motion.button
          type="button"
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-900/10 dark:shadow-black/40 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all select-none group"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-amber-400"
                >
                  <Moon className="w-4 h-4 fill-amber-400/20" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, scale: 0, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-amber-500"
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {showLabel && (
            <span className="text-xs font-semibold tracking-tight">
              {isDark ? "Dark" : "Light"}
            </span>
          )}
        </motion.button>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon-icon"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: 90, scale: 0 }}
              transition={{ duration: 0.18 }}
              className="text-amber-400"
            >
              <Moon className="w-4 h-4 fill-amber-400/20" />
            </motion.div>
          ) : (
            <motion.div
              key="sun-icon"
              initial={{ rotate: 90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              exit={{ rotate: -90, scale: 0 }}
              transition={{ duration: 0.18 }}
              className="text-amber-500"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // Default: "pill" variant for top navigation bars
  return (
    <div
      className={`bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-full p-1 flex items-center shadow-xs ${className}`}
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="pill-moon"
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: 90, scale: 0 }}
                transition={{ duration: 0.18 }}
                className="text-amber-400"
              >
                <Moon className="w-3.5 h-3.5 fill-amber-400/20" />
              </motion.div>
            ) : (
              <motion.div
                key="pill-sun"
                initial={{ rotate: 90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                exit={{ rotate: -90, scale: 0 }}
                transition={{ duration: 0.18 }}
                className="text-amber-500"
              >
                <Sun className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showLabel && (
          <span className="hidden sm:inline font-medium">
            {isDark ? "Dark" : "Light"}
          </span>
        )}
      </button>
    </div>
  );
}
