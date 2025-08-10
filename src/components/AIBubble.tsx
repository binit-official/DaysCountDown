import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIBubbleProps {
  isNyxOpen: boolean;
  setNyxOpen: (open: boolean) => void;
  isSallyOpen: boolean;
  setSallyOpen: (open: boolean) => void;
}

export const AIBubble: React.FC<AIBubbleProps> = ({
  setNyxOpen,
  setSallyOpen,
}) => {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  // High-contrast gradient for parent bubble
  const parentBubbleClass =
    "bg-gradient-to-br from-primary to-secondary border-2 border-white shadow-lg rounded-full w-16 h-16 flex items-center justify-center";

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-4 z-[100] flex flex-col items-start gap-4"
    >
      <AnimatePresence>
        {!expanded && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          >
            <Button
              size="icon"
              className={parentBubbleClass}
              onClick={() => setExpanded(true)}
              aria-label="Open AI Assistants"
            >
              <Bot className="h-8 w-8 text-white drop-shadow" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-row gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.1, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                size="icon"
                className="rounded-full w-14 h-14 shadow bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white"
                onClick={() => {
                  setSallyOpen(true);
                  setExpanded(false);
                }}
                aria-label="Open Sally"
              >
                <Sparkles className="h-7 w-7 text-white drop-shadow" />
              </Button>
              <span className="ml-2 text-xs font-bold text-purple-700">
                Sally
              </span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                size="icon"
                className="rounded-full w-14 h-14 shadow bg-gradient-to-br from-gray-900 to-cyan-600 border-2 border-white"
                onClick={() => {
                  setNyxOpen(true);
                  setExpanded(false);
                }}
                aria-label="Open Nyx"
              >
                <Bot className="h-7 w-7 text-cyan-300 drop-shadow" />
              </Button>
              <span className="ml-2 text-xs font-bold text-cyan-700">Nyx</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};