import { useCallback, useState } from "react";
import { uid } from "../model";
import { Icon } from "./ui";

export type ToastKind = "ok" | "err" | "info";
type Toast = { id: string; kind: ToastKind; text: string };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = uid();
      setToasts((t) => [...t.slice(-4), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === "err" ? 8000 : 4000);
    },
    [dismiss],
  );
  return { toasts, push, dismiss };
}

export function Toasts({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          <Icon name={t.kind === "err" ? "alert" : "check"} size={15} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
