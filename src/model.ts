// Editor state <-> Yapin webhook payloads (Discord-compatible shape).

export const uid = () => Math.random().toString(36).slice(2, 10);

export const LIMITS = {
  content: 2000,
  username: 80,
  embeds: 10,
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  embedTotal: 6000,
};

export interface FieldS {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedS {
  id: string;
  title: string;
  url: string;
  description: string;
  color: string; // "#rrggbb" or ""
  timestamp: string; // ISO or ""
  authorName: string;
  authorUrl: string;
  authorIcon: string;
  footerText: string;
  footerIcon: string;
  image: string;
  thumbnail: string;
  fields: FieldS[];
}

export interface MessageS {
  id: string;
  content: string;
  username: string;
  avatarUrl: string;
  embeds: EmbedS[];
}

export interface TargetS {
  id: string;
  url: string;
}

export interface WebhookInfo {
  id: string;
  name: string;
  avatar_url: string | null;
  channel_id?: string;
  guild_id?: string;
}

// ---------- factories ----------

export const newField = (p: Partial<FieldS> = {}): FieldS => ({
  id: uid(),
  name: "",
  value: "",
  inline: false,
  ...p,
});

export const newEmbed = (p: Partial<EmbedS> = {}): EmbedS => ({
  id: uid(),
  title: "",
  url: "",
  description: "",
  color: "#ff6b4a",
  timestamp: "",
  authorName: "",
  authorUrl: "",
  authorIcon: "",
  footerText: "",
  footerIcon: "",
  image: "",
  thumbnail: "",
  fields: [],
  ...p,
});

export const newMessage = (p: Partial<MessageS> = {}): MessageS => ({
  id: uid(),
  content: "",
  username: "",
  avatarUrl: "",
  embeds: [],
  ...p,
});

export const cloneEmbed = (e: EmbedS): EmbedS => ({
  ...e,
  id: uid(),
  fields: e.fields.map((f) => ({ ...f, id: uid() })),
});

export const cloneMessage = (m: MessageS): MessageS => ({
  ...m,
  id: uid(),
  embeds: m.embeds.map(cloneEmbed),
});

// ---------- webhook URLs ----------

const WEBHOOK_RE =
  /^https?:\/\/(?:www\.)?(?:yapin\.gg|yapper\.website)\/api\/webhooks\/([\w-]+)\/([\w-]+)\/?(?:[?#].*)?$/i;

export function parseWebhook(url: string): { id: string; token: string } | null {
  const m = WEBHOOK_RE.exec(url.trim());
  return m ? { id: m[1], token: m[2] } : null;
}

/** Canonical API URL. Bare yapin.gg redirects, which breaks CORS POSTs. */
export function webhookApiUrl(url: string): string | null {
  const w = parseWebhook(url);
  return w ? `https://www.yapin.gg/api/webhooks/${w.id}/${w.token}` : null;
}

// ---------- conversion ----------

const str = (v: unknown) => (typeof v === "string" ? v : "");
const colorToHex = (c: unknown) =>
  typeof c === "number" && c >= 0 ? "#" + c.toString(16).padStart(6, "0").slice(-6) : "";

type Json = Record<string, any>;

export function embedToApi(e: EmbedS): Json {
  const o: Json = {};
  if (e.authorName) {
    o.author = { name: e.authorName };
    if (e.authorUrl.trim()) o.author.url = e.authorUrl.trim();
    if (e.authorIcon.trim()) o.author.icon_url = e.authorIcon.trim();
  }
  if (e.title) o.title = e.title;
  if (e.url.trim()) o.url = e.url.trim();
  if (e.description) o.description = e.description;
  if (e.color) o.color = parseInt(e.color.slice(1), 16);
  const fields = e.fields
    .filter((f) => f.name || f.value)
    .map((f) => ({ name: f.name, value: f.value, ...(f.inline ? { inline: true } : {}) }));
  if (fields.length) o.fields = fields;
  if (e.image.trim()) o.image = { url: e.image.trim() };
  if (e.thumbnail.trim()) o.thumbnail = { url: e.thumbnail.trim() };
  if (e.footerText) {
    o.footer = { text: e.footerText };
    if (e.footerIcon.trim()) o.footer.icon_url = e.footerIcon.trim();
  }
  if (e.timestamp) o.timestamp = e.timestamp;
  return o;
}

export function toPayload(m: MessageS): Json {
  const p: Json = {};
  if (m.content) p.content = m.content;
  if (m.username.trim()) p.username = m.username.trim();
  if (m.avatarUrl.trim()) p.avatar_url = m.avatarUrl.trim();
  const embeds = m.embeds.map(embedToApi);
  if (embeds.length) p.embeds = embeds;
  return p;
}

export function embedFromApi(o: Json): EmbedS {
  return newEmbed({
    title: str(o.title),
    url: str(o.url),
    description: str(o.description),
    color: colorToHex(o.color),
    timestamp: str(o.timestamp),
    authorName: str(o.author?.name),
    authorUrl: str(o.author?.url),
    authorIcon: str(o.author?.icon_url),
    footerText: str(o.footer?.text),
    footerIcon: str(o.footer?.icon_url),
    image: str(o.image?.url),
    thumbnail: str(o.thumbnail?.url),
    fields: Array.isArray(o.fields)
      ? o.fields.map((f: Json) => newField({ name: str(f?.name), value: str(f?.value), inline: !!f?.inline }))
      : [],
  });
}

export function fromPayload(p: Json): MessageS {
  if (!p || typeof p !== "object" || Array.isArray(p)) throw new Error("Expected a JSON object");
  return newMessage({
    content: str(p.content),
    username: str(p.username),
    avatarUrl: str(p.avatar_url),
    embeds: Array.isArray(p.embeds) ? p.embeds.slice(0, LIMITS.embeds).map(embedFromApi) : [],
  });
}

/**
 * Accepts a single payload, an array of payloads, or Discohook's
 * `{ messages: [{ data }] }` backup / share format.
 */
export function parseAny(json: unknown): MessageS[] {
  if (Array.isArray(json)) return json.map(fromPayload);
  if (json && typeof json === "object" && Array.isArray((json as Json).messages)) {
    return (json as Json).messages.map((m: Json) => fromPayload(m?.data ?? m));
  }
  return [fromPayload(json as Json)];
}

export const toBackup = (messages: MessageS[]) => ({
  version: "yaphook-1",
  messages: messages.map((m) => ({ data: toPayload(m) })),
});

// ---------- validation ----------

const isUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u.trim());

export function embedLength(e: EmbedS): number {
  return (
    e.title.length +
    e.description.length +
    e.authorName.length +
    e.footerText.length +
    e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0)
  );
}

export function validateMessage(m: MessageS): string[] {
  const errs: string[] = [];
  const p = toPayload(m);
  if (!p.content && !m.embeds.length) errs.push("needs content or at least one embed");
  if (m.content.length > LIMITS.content) errs.push(`content is over ${LIMITS.content} characters`);
  if (m.username.length > LIMITS.username) errs.push(`username is over ${LIMITS.username} characters`);
  if (m.avatarUrl.trim() && !isUrl(m.avatarUrl)) errs.push("avatar URL is not a valid http(s) URL");
  if (m.embeds.length > LIMITS.embeds) errs.push(`more than ${LIMITS.embeds} embeds`);

  let total = 0;
  m.embeds.forEach((e, i) => {
    const at = `embed ${i + 1}`;
    const api = embedToApi(e);
    const visible = Object.keys(api).filter((k) => k !== "color");
    if (!visible.length) errs.push(`${at} is empty`);
    if (e.title.length > LIMITS.title) errs.push(`${at} title is over ${LIMITS.title} characters`);
    if (e.description.length > LIMITS.description)
      errs.push(`${at} description is over ${LIMITS.description} characters`);
    if (e.authorName.length > LIMITS.author) errs.push(`${at} author name is over ${LIMITS.author} characters`);
    if (e.footerText.length > LIMITS.footer) errs.push(`${at} footer is over ${LIMITS.footer} characters`);
    if (e.fields.length > LIMITS.fields) errs.push(`${at} has more than ${LIMITS.fields} fields`);
    e.fields.forEach((f, j) => {
      if (!f.name && !f.value) return;
      if (!f.name.trim()) errs.push(`${at} field ${j + 1} needs a name`);
      if (!f.value.trim()) errs.push(`${at} field ${j + 1} needs a value`);
      if (f.name.length > LIMITS.fieldName) errs.push(`${at} field ${j + 1} name is too long`);
      if (f.value.length > LIMITS.fieldValue) errs.push(`${at} field ${j + 1} value is too long`);
    });
    const urls: [string, string][] = [
      ["title URL", e.url],
      ["author URL", e.authorUrl],
      ["author icon", e.authorIcon],
      ["footer icon", e.footerIcon],
      ["image", e.image],
      ["thumbnail", e.thumbnail],
    ];
    for (const [label, u] of urls) if (u.trim() && !isUrl(u)) errs.push(`${at} ${label} is not a valid URL`);
    if ((e.authorUrl.trim() || e.authorIcon.trim()) && !e.authorName)
      errs.push(`${at} author URL/icon needs an author name`);
    if (e.footerIcon.trim() && !e.footerText) errs.push(`${at} footer icon needs footer text`);
    total += embedLength(e);
  });
  if (total > LIMITS.embedTotal) errs.push(`embeds total ${total}/${LIMITS.embedTotal} characters`);
  return errs;
}

// ---------- share links ----------

export function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Reads `#data=` (YapHook) or `?data=` (Discohook-style) share links. */
export function readShared(): MessageS[] | null {
  const hash = new URLSearchParams(location.hash.slice(1)).get("data");
  const query = new URLSearchParams(location.search).get("data");
  const raw = hash ?? query;
  if (!raw) return null;
  try {
    return parseAny(JSON.parse(b64urlDecode(raw)));
  } catch {
    return null;
  }
}

export const shareUrl = (messages: MessageS[]) =>
  `${location.origin}${location.pathname}#data=${b64urlEncode(JSON.stringify(toBackup(messages)))}`;

// ---------- sending ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function postMessage(apiUrl: string, payload: Json): Promise<Json> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${apiUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let body: Json | null = null;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON error page */
    }
    if (res.status === 429) {
      const wait = Math.min(Number(body?.retry_after ?? 1), 10);
      await sleep(wait * 1000 + 100);
      continue;
    }
    if (!res.ok) throw new Error(body?.message || body?.error || `HTTP ${res.status}`);
    return body ?? {};
  }
  throw new Error("Rate limited, try again in a moment");
}

export async function fetchWebhook(apiUrl: string, signal?: AbortSignal): Promise<WebhookInfo> {
  const res = await fetch(apiUrl, { signal });
  if (res.ok) return res.json();
  if (res.status === 404) throw new Error("Webhook not found");
  const body = await res.json().catch(() => null);
  throw new Error(body?.message || `HTTP ${res.status}`);
}
