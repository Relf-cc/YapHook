import { useEffect, useState } from "react";
import { Icon } from "./ui";

export type JsonModalSpec = {
  title: string;
  text: string;
  /** Throw to show an error and keep the modal open. */
  apply: (text: string) => void;
};

export function JsonModal({
  spec,
  onClose,
  onCopied,
}: {
  spec: JsonModalSpec;
  onClose: () => void;
  onCopied: () => void;
}) {
  const [text, setText] = useState(spec.text);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const apply = () => {
    try {
      spec.apply(text);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={spec.title}>
        <header className="modal-head">
          <h2>{spec.title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <textarea
          className="input mono json-area"
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        {error && (
          <div className="modal-error">
            <Icon name="alert" size={14} /> {error}
          </div>
        )}
        <footer className="modal-foot">
          <button type="button" className="btn ghost" onClick={() => navigator.clipboard?.writeText(text).then(onCopied)}>
            <Icon name="copy" /> Copy
          </button>
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={apply}>
            <Icon name="check" /> Apply
          </button>
        </footer>
      </div>
    </div>
  );
}
