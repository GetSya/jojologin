"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastData = { id: string; message: string; type: "success" | "error" | "info" };

let pushFn: ((t: Omit<ToastData, "id">) => void) | null = null;

export function pushToast(t: Omit<ToastData, "id">) {
  pushFn?.(t);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    pushFn = ({ message, type }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
    };
    return () => {
      pushFn = null;
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`flex min-w-[300px] max-w-[420px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-xl ${
              t.type === "success"
                ? "border-emerald-200 bg-white text-zinc-900"
                : t.type === "error"
                  ? "border-red-200 bg-white text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-900"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            )}
            <p className="flex-1 text-[13.5px] font-medium leading-5">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="rounded-full p-1 hover:bg-zinc-100"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
