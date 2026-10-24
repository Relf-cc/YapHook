import { ReactNode } from "react";
import { LIMITS } from "../model";
import { Markdown } from "../markdown";
import { Icon } from "./ui";

const SECTIONS = [
  ["start", "Quick start"],
  ["building", "Building messages"],
  ["formatting", "Formatting"],
  ["limits", "Limits"],
  ["sharing", "Sharing & JSON"],
  ["privacy", "Privacy & safety"],
  ["faq", "Troubleshooting"],
] as const;

const FORMATTING: [string, string][] = [
  ["**bold**", "**bold**"],
  ["*italic* or _italic_", "*italic* or _italic_"],
  ["__underline__", "__underline__"],
  ["~~strikethrough~~", "~~strikethrough~~"],
  ["||spoiler||", "||spoiler|| (click it)"],
  ["`inline code`", "`inline code`"],
  ["[masked link](https://yapin.gg)", "[masked link](https://yapin.gg)"],
  ["# Big heading", "# Big heading"],
  ["### Small heading", "### Small heading"],
  ["-# subtext", "-# subtext"],
  ["> quote", "> quote"],
  ["- list item", "- list item\n- another one"],
  ["1. numbered item", "1. numbered item\n2. second item"],
  ["```\ncode block\n```", "```\ncode block\n```"],
];

const TIMESTAMPS: [string, string][] = [
  ["t", "Short time"],
  ["T", "Long time"],
  ["d", "Short date"],
  ["D", "Long date"],
  ["f", "Date & time (default)"],
  ["F", "Full date & time"],
  ["R", "Relative"],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`help-${id}`} className="help-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const jump = (id: string) =>
  document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function Help({ onOpenBuilder }: { onOpenBuilder: () => void }) {
  const now = Math.floor(Date.now() / 1000);
  return (
    <div className="help">
      <nav className="help-toc" aria-label="Help sections">
        <span className="help-toc-title">On this page</span>
        {SECTIONS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => jump(id)}>
            {label}
          </button>
        ))}
      </nav>

      <article className="help-body">
        <header className="help-hero">
          <h1>YapHook help</h1>
          <p>
            YapHook builds and sends messages through <strong>Yapin'</strong> webhooks: rich embeds, custom names and
            avatars, several messages at once. No account or bot needed.
          </p>
          <button type="button" className="btn primary" onClick={onOpenBuilder}>
            <Icon name="edit" /> Open the builder
          </button>
        </header>

        <Section id="start" title="Quick start">
          <ol className="steps">
            <li>
              <strong>Create a webhook in Yapin'.</strong> In your server's settings, create a webhook for the channel
              you want to post in and copy its URL. It looks like
              <code className="url">https://www.yapin.gg/api/webhooks/&lt;id&gt;/&lt;token&gt;</code>
            </li>
            <li>
              <strong>Paste it into the Webhooks box.</strong> YapHook checks it straight away and shows the webhook's
              name when it's ready.
            </li>
            <li>
              <strong>Write your message.</strong> Add content, embeds and fields. The preview updates as you type.
            </li>
            <li>
              <strong>Hit Send.</strong> Every message is posted to every webhook in the list, in order.
            </li>
          </ol>
        </Section>

        <Section id="building" title="Building messages">
          <dl className="help-dl">
            <dt>Content</dt>
            <dd>The plain message text above any embeds. Supports all formatting below.</dd>
            <dt>Profile</dt>
            <dd>
              Override the username and avatar for this message only. Leave blank to use the webhook's own name and
              avatar.
            </dd>
            <dt>Embeds</dt>
            <dd>
              Cards with a coloured sidebar. Each one can have an author, title (optionally linked), description,
              fields, a large image, a thumbnail, a footer and a timestamp. Use the arrows to reorder and the copy
              button to duplicate.
            </dd>
            <dt>Fields</dt>
            <dd>
              Name/value pairs inside an embed. Turn on <em>Inline</em> to place fields side by side: up to three per
              row, or two when the embed has a thumbnail.
            </dd>
            <dt>Timestamp</dt>
            <dd>Shown in the embed footer in each reader's own time zone. Click <em>Now</em> for the current time.</dd>
            <dt>Multiple messages</dt>
            <dd>
              Use <em>Add message</em> to send a sequence in one go. Consecutive messages with the same profile are
              grouped in the preview, just like in chat.
            </dd>
            <dt>Multiple webhooks</dt>
            <dd>Add more than one webhook to post the same messages to several channels at once.</dd>
          </dl>
        </Section>

        <Section id="formatting" title="Formatting">
          <p>
            Works in message content, embed descriptions and field values. Titles and field names support inline styles
            only.
          </p>
          <table className="help-table">
            <thead>
              <tr>
                <th>You type</th>
                <th>You get</th>
              </tr>
            </thead>
            <tbody>
              {FORMATTING.map(([src, render]) => (
                <tr key={src}>
                  <td>
                    <code className="src">{src}</code>
                  </td>
                  <td className="rendered">
                    <Markdown text={render} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Timestamps</h3>
          <p>
            <code>&lt;t:UNIX:STYLE&gt;</code> renders a date in each reader's local time. The current Unix time is{" "}
            <code>{now}</code>.
          </p>
          <table className="help-table">
            <thead>
              <tr>
                <th>You type</th>
                <th>Style</th>
                <th>You get</th>
              </tr>
            </thead>
            <tbody>
              {TIMESTAMPS.map(([style, label]) => (
                <tr key={style}>
                  <td>
                    <code className="src">{`<t:${now}:${style}>`}</code>
                  </td>
                  <td className="muted">{label}</td>
                  <td className="rendered">
                    <Markdown text={`<t:${now}:${style}>`} mode="inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="limits" title="Limits">
          <p>YapHook counts characters as you type and won't send until everything fits.</p>
          <table className="help-table compact">
            <tbody>
              {[
                ["Message content", LIMITS.content],
                ["Username", LIMITS.username],
                ["Embeds per message", LIMITS.embeds],
                ["Embed title", LIMITS.title],
                ["Embed description", LIMITS.description],
                ["Fields per embed", LIMITS.fields],
                ["Field name", LIMITS.fieldName],
                ["Field value", LIMITS.fieldValue],
                ["Author name", LIMITS.author],
                ["Footer text", LIMITS.footer],
                ["All embed text combined", LIMITS.embedTotal],
              ].map(([label, n]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="sharing" title="Sharing & JSON">
          <dl className="help-dl">
            <dt>Share</dt>
            <dd>
              Copies a link containing your messages. Anyone who opens it gets an editable copy.{" "}
              <strong>Webhook URLs are never included.</strong>
            </dd>
            <dt>JSON (top bar)</dt>
            <dd>
              A backup of every message. Paste one back in to restore it. Discohook backups and share data import too.
            </dd>
            <dt>JSON (per message)</dt>
            <dd>
              The exact payload sent to Yapin'. You can also paste in a payload from a bot or script to load it.
            </dd>
          </dl>
          <p>Payloads use the same shape Discord webhooks do, so you can send them from anywhere:</p>
          <pre className="md-pre">
            <code>{`curl -X POST "https://www.yapin.gg/api/webhooks/<id>/<token>" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello!", "embeds": [{"title": "Hi", "color": 16739146}]}'`}</code>
          </pre>
        </Section>

        <Section id="privacy" title="Privacy & safety">
          <ul className="help-list">
            <li>YapHook runs entirely in your browser. There's no YapHook server and nothing is logged.</li>
            <li>Messages go straight from your browser to Yapin'.</li>
            <li>
              Your messages and webhook URLs are saved in this browser's local storage so they're here next time. Use{" "}
              <em>Clear</em> to reset the messages.
            </li>
            <li>
              <strong>Treat a webhook URL like a password.</strong> Anyone with it can post in your channel. If one
              leaks, delete or regenerate the webhook in Yapin'.
            </li>
            <li>Images in the preview load from whatever URLs you enter, so those sites can see your IP address.</li>
          </ul>
        </Section>

        <Section id="faq" title="Troubleshooting">
          <dl className="help-dl">
            <dt>"Not a Yapin webhook URL"</dt>
            <dd>
              The URL should start with <code>https://www.yapin.gg/api/webhooks/</code> and end with an id and token.
            </dd>
            <dt>"Webhook not found" or "Invalid Webhook Token"</dt>
            <dd>The webhook was deleted or its token was regenerated. Copy a fresh URL from Yapin'.</dd>
            <dt>Can I edit or delete a message after sending?</dt>
            <dd>Not yet. Yapin's webhook API only supports sending, so double-check the preview first.</dd>
            <dt>My image doesn't show</dt>
            <dd>
              Use a direct <code>https://</code> link to the image file itself (ending in .png, .jpg, .gif or .webp),
              not a link to a page that contains it.
            </dd>
            <dt>Rate limited</dt>
            <dd>YapHook waits and retries automatically. If it keeps failing, give it a minute.</dd>
          </dl>
        </Section>

        <footer className="credits">
          YapHook is an unofficial community tool for{" "}
          <a href="https://yapin.gg" target="_blank" rel="noreferrer">
            Yapin'
          </a>
          , inspired by{" "}
          <a href="https://github.com/discohook/discohook" target="_blank" rel="noreferrer">
            Discohook
          </a>
          . Questions or ideas?{" "}
          <a href="https://yapin.gg/invite/yaphook" target="_blank" rel="noreferrer">
            Join the YapHook server
          </a>
          .
        </footer>
      </article>
    </div>
  );
}
