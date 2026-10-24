// Discord-flavoured markdown -> React nodes. Never touches innerHTML.
import { ReactNode, useState } from "react";

interface Opts {
  links: boolean;
}

type Rule = {
  re: RegExp;
  render: (m: RegExpExecArray, key: string, o: Opts) => ReactNode;
};

function Spoiler({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`md-spoiler${open ? " open" : ""}`} onClick={() => setOpen(true)}>
      {children}
    </span>
  );
}

const ext = (href: string, key: string, children: ReactNode) => (
  <a key={key} href={href} target="_blank" rel="noreferrer noopener">
    {children}
  </a>
);

function formatTimestamp(unix: number, style = "f"): string {
  const d = new Date(unix * 1000);
  if (isNaN(d.getTime())) return "Invalid Date";
  const t = (o: Intl.DateTimeFormatOptions) => d.toLocaleString(undefined, o);
  switch (style) {
    case "t": return t({ hour: "numeric", minute: "2-digit" });
    case "T": return t({ hour: "numeric", minute: "2-digit", second: "2-digit" });
    case "d": return t({ day: "2-digit", month: "2-digit", year: "numeric" });
    case "D": return t({ day: "numeric", month: "long", year: "numeric" });
    case "F": return t({ weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
    case "R": {
      const diff = (d.getTime() - Date.now()) / 1000;
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1],
      ];
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      for (const [u, s] of units) if (Math.abs(diff) >= s || u === "second") return rtf.format(Math.round(diff / s), u);
      return "";
    }
    default: return t({ day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
}

const RULES: Rule[] = [
  { re: /\\([^\w\s])/y, render: (m) => m[1] },
  {
    re: /(`+)([\s\S]*?[^`])\1(?!`)/y,
    render: (m, k) => <code key={k} className="md-code">{m[2]}</code>,
  },
  {
    re: /\[([^\[\]\n]+)\]\(<?(https?:\/\/[^\s)>]+)>?\)/y,
    render: (m, k, o) => (o.links ? ext(m[2], k, inline(m[1], o, k)) : m[0]),
  },
  { re: /<(https?:\/\/[^\s>]+)>/y, render: (m, k) => ext(m[1], k, m[1]) },
  { re: /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/y, render: (m, k) => ext(m[0], k, m[0]) },
  {
    re: /<t:(-?\d{1,13})(?::([tTdDfFR]))?>/y,
    render: (m, k) => <span key={k} className="md-time">{formatTimestamp(Number(m[1]), m[2])}</span>,
  },
  {
    re: /<(@!?|@&|#)([\w-]+)>/y,
    render: (m, k) => (
      <span key={k} className="md-mention">
        {m[1] === "#" ? "#channel" : m[1] === "@&" ? "@role" : "@user"}
      </span>
    ),
  },
  { re: /@(everyone|here)\b/y, render: (m, k) => <span key={k} className="md-mention">{m[0]}</span> },
  { re: /\*\*([\s\S]+?)\*\*(?!\*)/y, render: (m, k, o) => <strong key={k}>{inline(m[1], o, k)}</strong> },
  { re: /__([\s\S]+?)__(?!_)/y, render: (m, k, o) => <u key={k}>{inline(m[1], o, k)}</u> },
  {
    re: /\*(?=\S)((?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s*\\]|\*\*)|[^\s*\\])+?)\*(?!\*)/y,
    render: (m, k, o) => <em key={k}>{inline(m[1], o, k)}</em>,
  },
  {
    re: /(?<!\w)_((?:__|\\[\s\S]|[^\\_])+?)_(?!\w)/y,
    render: (m, k, o) => <em key={k}>{inline(m[1], o, k)}</em>,
  },
  { re: /~~([\s\S]+?)~~/y, render: (m, k, o) => <s key={k}>{inline(m[1], o, k)}</s> },
  { re: /\|\|([\s\S]+?)\|\|/y, render: (m, k, o) => <Spoiler key={k}>{inline(m[1], o, k)}</Spoiler> },
];

const SPECIAL = /[\\`\[<h@*_~|]/g;

function inline(text: string, o: Opts, prefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let pos = 0;
  let buf = "";
  let n = 0;
  outer: while (pos < text.length) {
    for (const rule of RULES) {
      rule.re.lastIndex = pos;
      const m = rule.re.exec(text);
      if (m && m[0].length) {
        if (buf) out.push(buf), (buf = "");
        out.push(rule.render(m, `${prefix}.${n++}`, o));
        pos += m[0].length;
        continue outer;
      }
    }
    SPECIAL.lastIndex = pos + 1;
    const next = SPECIAL.exec(text);
    const end = next ? next.index : text.length;
    buf += text.slice(pos, end);
    pos = end;
  }
  if (buf) out.push(buf);
  return out;
}

function lines(text: string, o: Opts, prefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const ls = text.split("\n");
  let para: string[] = [];
  let n = 0;
  const key = () => `${prefix}.${n++}`;
  const flush = () => {
    if (!para.length) return;
    const k = key();
    out.push(<div key={k} className="md-para">{inline(para.join("\n"), o, k)}</div>);
    para = [];
  };

  for (let i = 0; i < ls.length; i++) {
    const line = ls[i];
    let m: RegExpExecArray | null;

    if ((m = /^>>> ?([\s\S]*)$/.exec(line))) {
      flush();
      const rest = [m[1], ...ls.slice(i + 1)].join("\n");
      const k = key();
      out.push(<blockquote key={k} className="md-quote">{lines(rest, o, k)}</blockquote>);
      return out;
    }
    if (/^> ?/.test(line) && line.length) {
      flush();
      const q: string[] = [];
      while (i < ls.length && /^>(?: |$)/.test(ls[i])) q.push(ls[i++].replace(/^> ?/, ""));
      i--;
      if (q.length) {
        const k = key();
        out.push(<blockquote key={k} className="md-quote">{lines(q.join("\n"), o, k)}</blockquote>);
        continue;
      }
    }
    if ((m = /^(#{1,3}) +(\S.*)$/.exec(line))) {
      flush();
      const k = key();
      out.push(<div key={k} className={`md-h md-h${m[1].length}`}>{inline(m[2], o, k)}</div>);
      continue;
    }
    if ((m = /^-# +(\S.*)$/.exec(line))) {
      flush();
      const k = key();
      out.push(<div key={k} className="md-sub">{inline(m[1], o, k)}</div>);
      continue;
    }
    if ((m = /^( *)([-*]|\d{1,9}\.) +(\S.*)$/.exec(line))) {
      flush();
      const ordered = /\d/.test(m[2]);
      const start = ordered ? parseInt(m[2]) : undefined;
      const items: { depth: number; text: string }[] = [];
      while (i < ls.length && (m = /^( *)([-*]|\d{1,9}\.) +(\S.*)$/.exec(ls[i])) && /\d/.test(m[2]) === ordered) {
        items.push({ depth: Math.min(Math.floor(m[1].length / 2), 3), text: m[3] });
        i++;
      }
      i--;
      const k = key();
      const lis = items.map((it, j) => (
        <li key={j} style={{ marginLeft: it.depth * 16 }}>{inline(it.text, o, `${k}.${j}`)}</li>
      ));
      out.push(ordered ? <ol key={k} start={start} className="md-list">{lis}</ol> : <ul key={k} className="md-list">{lis}</ul>);
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

function blocks(text: string, o: Opts): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /```(?:([\w+#.-]*)\n)?([\s\S]*?)```/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(re)) {
    const before = text.slice(last, m.index).replace(/\n$/, "");
    if (before) out.push(...lines(before, o, `b${n++}`));
    out.push(
      <pre key={`c${n++}`} className="md-pre">
        <code>{m[2].replace(/^\n|\n$/g, "")}</code>
      </pre>,
    );
    last = m.index! + m[0].length;
    if (text[last] === "\n") last++;
  }
  const rest = text.slice(last);
  if (rest) out.push(...lines(rest, o, `b${n++}`));
  return out;
}

export function Markdown({ text, mode = "block", links = true }: { text: string; mode?: "block" | "inline"; links?: boolean }) {
  const o = { links };
  return <>{mode === "inline" ? inline(text, o) : blocks(text, o)}</>;
}
