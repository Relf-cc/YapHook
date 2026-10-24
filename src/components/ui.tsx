import { CSSProperties, ReactNode, useState } from "react";

const PATHS: Record<string, ReactNode> = {
  chevron: <path d="m6 9 6 6 6-6" />,
  up: <path d="m18 15-6-6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  trash: <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 5v5m4-5v5" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  code: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  link: (
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  ),
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  alert: <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />,
};

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function IconButton({
  icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-btn${danger ? " danger" : ""}`}
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} />
    </button>
  );
}

export function Card({
  title,
  badge,
  actions,
  children,
  accent,
  level = 0,
  defaultOpen = true,
}: {
  title: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  accent?: string;
  level?: 0 | 1 | 2;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={`card lvl${level}${open ? "" : " closed"}`}
      style={accent ? ({ "--card-accent": accent } as CSSProperties) : undefined}
    >
      <header className="card-head" onClick={() => setOpen(!open)}>
        <span className="card-chev">
          <Icon name="chevron" />
        </span>
        <span className="card-title">{title}</span>
        {badge && <span className="card-badge">{badge}</span>}
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      </header>
      {open && <div className="card-body">{children}</div>}
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  max,
  placeholder,
  multiline,
  rows = 3,
  type = "text",
  hint,
  mono,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  hint?: ReactNode;
  mono?: boolean;
  invalid?: boolean;
}) {
  const over = max !== undefined && value.length > max;
  const cls = `input${mono ? " mono" : ""}${over || invalid ? " bad" : ""}`;
  return (
    <label className="fld">
      <span className="fld-label">
        <span>{label}</span>
        {max !== undefined && (
          <span className={`count${over ? " over" : value.length > max * 0.9 ? " near" : ""}`}>
            {value.length}/{max}
          </span>
        )}
      </span>
      {multiline ? (
        <textarea
          className={cls}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={cls}
          type={type}
          value={value}
          placeholder={placeholder}
          spellCheck={type === "text"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <span className="fld-hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}

const SWATCHES = [
  "#ff6b4a", "#ff9966", "#ffcc66", "#3fcf82", "#3fc1a8", "#5aa9e6",
  "#5865f2", "#9b59ff", "#ff5c8a", "#f2555a", "#949ba4", "#2b2c33",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const commit = (v: string) => {
    const hex = v.trim().replace(/^#?/, "#").toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(hex)) onChange(hex);
    else if (/^#[0-9a-f]{3}$/.test(hex)) onChange("#" + [...hex.slice(1)].map((c) => c + c).join(""));
    setDraft(null);
  };
  return (
    <div className="fld">
      <span className="fld-label">
        <span>Sidebar colour</span>
      </span>
      <div className="color-row">
        <label className="color-well" style={{ background: value || "transparent" }} title="Pick a colour">
          <input type="color" value={value || "#ff6b4a"} onChange={(e) => onChange(e.target.value)} />
          {!value && <span className="color-none" />}
        </label>
        <input
          className="input mono color-hex"
          value={shown}
          placeholder="none"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
        />
        <div className="swatches">
          {SWATCHES.map((c) => (
            <button
              type="button"
              key={c}
              className={`swatch${c === value ? " on" : ""}`}
              style={{ background: c }}
              title={c}
              onClick={() => onChange(c)}
            />
          ))}
          <button type="button" className="swatch clear" title="No colour" onClick={() => onChange("")}>
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Formats an ISO string for `<input type="datetime-local">` in local time. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
