import { CSSProperties, useState } from "react";
import { EmbedS, FieldS, MessageS, WebhookInfo } from "../model";
import { Markdown } from "../markdown";

const DEFAULT_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ff5a35"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="37" cy="17" r="4.5"/><path d="M37 21.5v16a10 10 0 0 1-20 0v-4l6 5"/></g></svg>`,
  );

const isHttp = (u: string) => /^https?:\/\/\S+$/i.test(u.trim());

function Img({ src, className, alt = "" }: { src: string; className: string; alt?: string }) {
  const [broken, setBroken] = useState<string | null>(null);
  if (!isHttp(src) || broken === src) return null;
  return <img className={className} src={src.trim()} alt={alt} loading="lazy" onError={() => setBroken(src)} />;
}

function formatEmbedTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Invalid Date";
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Today at ${time}`;
  if (d.toDateString() === yest.toDateString()) return `Yesterday at ${time}`;
  return `${d.toLocaleDateString()} ${time}`;
}

function fieldRows(fields: FieldS[], hasThumb: boolean): FieldS[][] {
  const max = hasThumb ? 2 : 3;
  const rows: FieldS[][] = [];
  let cur: FieldS[] = [];
  for (const f of fields) {
    if (!f.name && !f.value) continue;
    if (!f.inline || cur.length >= max) {
      if (cur.length) rows.push(cur);
      cur = [];
    }
    if (!f.inline) rows.push([f]);
    else cur.push(f);
  }
  if (cur.length) rows.push(cur);
  return rows;
}

function EmbedPreview({ e }: { e: EmbedS }) {
  const hasThumb = isHttp(e.thumbnail);
  const rows = fieldRows(e.fields, hasThumb);
  const footer = e.footerText || e.timestamp;
  return (
    <div className="pv-embed" style={{ "--embed-color": e.color || "#1e1f24" } as CSSProperties}>
      <div className="pv-embed-grid">
        <div className="pv-embed-body">
          {e.authorName && (
            <div className="pv-author">
              <Img src={e.authorIcon} className="pv-author-icon" />
              {isHttp(e.authorUrl) ? (
                <a href={e.authorUrl} target="_blank" rel="noreferrer noopener">
                  {e.authorName}
                </a>
              ) : (
                <span>{e.authorName}</span>
              )}
            </div>
          )}
          {e.title && (
            <div className="pv-title">
              {isHttp(e.url) ? (
                <a href={e.url} target="_blank" rel="noreferrer noopener">
                  <Markdown text={e.title} mode="inline" links={false} />
                </a>
              ) : (
                <Markdown text={e.title} mode="inline" />
              )}
            </div>
          )}
          {e.description && (
            <div className="pv-desc">
              <Markdown text={e.description} />
            </div>
          )}
          {rows.length > 0 && (
            <div className="pv-fields">
              {rows.map((row, i) => (
                <div key={i} className="pv-field-row" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                  {row.map((f) => (
                    <div key={f.id} className="pv-field">
                      <div className="pv-field-name">
                        <Markdown text={f.name} mode="inline" />
                      </div>
                      <div className="pv-field-value">
                        <Markdown text={f.value} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {hasThumb && <Img src={e.thumbnail} className="pv-thumb" />}
        <Img src={e.image} className="pv-image" />
        {footer && (
          <div className="pv-footer">
            {e.footerText && <Img src={e.footerIcon} className="pv-footer-icon" />}
            <span>
              {e.footerText}
              {e.footerText && e.timestamp && <span className="pv-dot">•</span>}
              {e.timestamp && formatEmbedTime(e.timestamp)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagePreview({ m, info, grouped }: { m: MessageS; info?: WebhookInfo; grouped: boolean }) {
  const name = m.username.trim() || info?.name || "YapHook";
  const avatar = isHttp(m.avatarUrl) ? m.avatarUrl.trim() : info?.avatar_url || DEFAULT_AVATAR;
  const now = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const empty = !m.content && !m.embeds.length;
  return (
    <article className={`pv-msg${grouped ? " grouped" : ""}`}>
      {grouped ? (
        <span className="pv-hover-time">{now}</span>
      ) : (
        <img
          className="pv-avatar"
          src={avatar}
          alt=""
          onError={(ev) => ((ev.target as HTMLImageElement).src = DEFAULT_AVATAR)}
        />
      )}
      <div className="pv-main">
        {!grouped && (
          <div className="pv-head">
            <span className="pv-name">{name}</span>
            <span className="pv-tag">BOT</span>
            <span className="pv-time">Today at {now}</span>
          </div>
        )}
        {m.content && (
          <div className="pv-content">
            <Markdown text={m.content} />
          </div>
        )}
        {empty && <div className="pv-content pv-empty">Empty message</div>}
        {m.embeds.length > 0 && (
          <div className="pv-embeds">
            {m.embeds.map((e) => (
              <EmbedPreview key={e.id} e={e} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function Preview({ messages, info }: { messages: MessageS[]; info?: WebhookInfo }) {
  return (
    <div className="pv">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const grouped =
          !!prev && prev.username.trim() === m.username.trim() && prev.avatarUrl.trim() === m.avatarUrl.trim();
        return <MessagePreview key={m.id} m={m} info={info} grouped={grouped} />;
      })}
    </div>
  );
}
