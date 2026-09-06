"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "error" | "success";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Defaults to "error" — the overwhelming majority of calls report a failed request. */
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 6000;

/**
 * Mounted once in `AdminShell`, so any manager under `/admin` can report a
 * failed (or successful) request via `useToast()` instead of holding its own
 * `error` state and rendering its own inline message — see the admin-sections
 * `describeError` helper for where the message text itself comes from.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "error") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="alert"
              layout
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : -16,
                scale: prefersReducedMotion ? 1 : 0.95,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border bg-brand-white p-4 shadow-2xl",
                toast.variant === "error" ? "border-brand-red/20" : "border-brand-black/10",
              )}
            >
              {toast.variant === "error" ? (
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-brand-red" aria-hidden />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-black" aria-hidden />
              )}

              <p className="flex-1 text-sm text-brand-black">{toast.message}</p>

              <button
                type="button"
                aria-label="Закрыть уведомление"
                onClick={() => dismiss(toast.id)}
                className="-m-1 shrink-0 rounded-control p-1 text-brand-black/40 transition-colors hover:bg-brand-black/5 hover:text-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none active:bg-brand-black/10 active:text-brand-black"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
