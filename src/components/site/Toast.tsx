"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastContextValue = { show: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

/** Show a short, polite status message (for example "Email copied"). */
export function useToast() {
  return useContext(ToastContext);
}

const VISIBLE_MS = 2500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((next: string) => {
    window.clearTimeout(timer.current);
    setMessage(next);
    timer.current = window.setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* The live region always exists so screen readers announce new messages. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-(--z-toast) flex justify-center px-(--gutter)"
      >
        {message ? (
          <p className="pointer-events-auto rounded-full bg-bg-inverse px-5 py-3 text-sm font-medium text-text-inverse shadow-lg">
            {message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
