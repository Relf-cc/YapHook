import { ReactNode, useEffect, useMemo, useState } from "react";
import { LIMITS, MessageS } from "../model";
import { Markdown } from "../markdown";
import { EXAMPLES } from "../examples";
import { Icon } from "./ui";

const SERVER = "https://yapin.gg/invite/yaphook";

/* ---------------- small building blocks ---------------- */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`help-${id}`} className="help-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Callout({ kind = "tip", title, children }: { kind?: "tip" | "warn" | "stuck"; title: string; children: ReactNode }) {
  return (
    <div className={`callout ${kind}`}>
      <div className="callout-head">
        <Icon name={kind === "warn" ? "alert" : kind === "stuck" ? "question" : "bulb"} size={15} />
        {title}
      </div>
      <div className="callout-body">{children}</div>
    </div>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>;

const Jump = ({ to, children }: { to: string; children: ReactNode }) => <a href={`#help/${to}`}>{children}</a>;

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

/* ---------------- reference tables ---------------- */

const FORMATTING: [string, string][] = [
  ["**bold**", "**bold**"],
  ["*italic* or _italic_", "*italic* or _italic_"],
  ["***bold italic***", "***bold italic***"],
  ["__underline__", "__underline__"],
  ["~~strikethrough~~", "~~strikethrough~~"],
  ["||spoiler||", "||spoiler|| (click it)"],
  ["`inline code`", "`inline code`"],
  ["[masked link](https://yapin.gg)", "[masked link](https://yapin.gg)"],
  ["<https://yapin.gg>", "<https://yapin.gg>"],
  ["# Big heading", "# Big heading"],
  ["## Medium heading", "## Medium heading"],
  ["### Small heading", "### Small heading"],
  ["-# subtext", "-# subtext"],
  ["> quote", "> quote"],
  [">>> everything after", ">>> everything after\nis quoted"],
  ["- list item", "- list item\n- another one\n  - indented"],
  ["1. numbered item", "1. numbered item\n2. second item"],
  ["```\ncode block\n```", "```\ncode block\n```"],
  ["\\*escaped\\*", "\\*escaped\\*"],
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

const MENTIONS: [string, string][] = [
  ["<@000000000000000000>", "Pings one person"],
  ["<@&000000000000000000>", "Pings a role"],
  ["<#000000000000000000>", "Links a channel"],
  ["@everyone", "Pings everyone in the server"],
  ["@here", "Pings everyone currently online"],
];

const LIMIT_ROWS: [string, number][] = [
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
];

/* ---------------- troubleshooting ---------------- */

interface Faq {
  id: string;
  q: string;
  a: ReactNode;
  keywords?: string;
}

const FAQ: Faq[] = [
  {
    id: "nothing-happens",
    q: "I pressed Send and nothing happened",
    keywords: "send button disabled grey nothing broken stuck",
    a: (
      <>
        <p>Work down this list — it's almost always one of these:</p>
        <ul className="help-list">
          <li>
            <strong>No valid webhook.</strong> The Webhooks box at the top of the builder has to show a green name and{" "}
            <em>ready to send</em>. Red text there says exactly what's wrong with the URL.
          </li>
          <li>
            <strong>Something to fix.</strong> A red <em>issues</em> box under the editor lists everything blocking the
            send, like an empty embed or text over a limit.
          </li>
          <li>
            <strong>An error toast appeared and faded.</strong> Press Send again and read the box that stays under the
            editor — it explains the failure and links back here.
          </li>
          <li>
            <strong>The request is being blocked.</strong> See <Jump to="faq-network">Couldn't reach Yapin'</Jump>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "find-webhook",
    q: "Where do I get a webhook URL?",
    keywords: "create webhook url copy settings integrations channel permission manage",
    a: (
      <>
        <p>
          In Yapin', open the <strong>channel</strong> you want to post in, go to its settings, find{" "}
          <strong>Webhooks</strong>, create one, and copy its URL. Paste that into YapHook.
        </p>
        <p>
          You need permission to manage webhooks in that server. If there's no Webhooks option, you don't have it — ask
          a server admin to make one and send you the URL.
        </p>
        <p>
          A webhook belongs to the channel it was created in. To post somewhere else, make a second webhook there and{" "}
          <Jump to="faq-multiple">add both to YapHook</Jump>.
        </p>
      </>
    ),
  },
  {
    id: "url",
    q: "It says the URL isn't a Yapin' webhook URL",
    keywords: "invalid url token id truncated cut off paste https",
    a: (
      <>
        <p>
          The URL has to look exactly like this, with both an id and a token:
          <code className="url">https://www.yapin.gg/api/webhooks/&lt;id&gt;/&lt;token&gt;</code>
        </p>
        <ul className="help-list">
          <li>Copy it with Yapin's copy button. Selecting it by hand often grabs a shortened version with “…” in it.</li>
          <li>Make sure nothing was left behind — the token is the long part at the end.</li>
          <li>No spaces, quotes or line breaks around it.</li>
          <li>
            Already pasted? The hint under the box names the exact problem, whether that's a missing token, the wrong
            site or a truncated copy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "wrong-site",
    q: "Can I use a Discord webhook?",
    keywords: "discord discohook other platform slack guilded",
    a: (
      <p>
        No. YapHook only posts to Yapin' webhooks, and its production build is locked down so the browser can't send
        anywhere else. For Discord, use <Ext href="https://discohook.org">Discohook</Ext> — the payloads are the same
        shape, so a <Jump to="sharing">JSON backup</Jump> from one works in the other.
      </p>
    ),
  },
  {
    id: "token",
    q: "“Invalid Webhook Token” or “Webhook not found”",
    keywords: "401 404 50027 deleted regenerated reset token invalid expired",
    a: (
      <>
        <p>The URL is well-formed, but Yapin' won't accept it:</p>
        <ul className="help-list">
          <li>
            <strong>Invalid Webhook Token</strong> — the webhook's token was reset, or a character of the URL is wrong.
          </li>
          <li>
            <strong>Webhook not found</strong> — the webhook or its channel was deleted.
          </li>
        </ul>
        <p>Either way the fix is the same: create or open the webhook in Yapin' and copy a fresh URL.</p>
      </>
    ),
  },
  {
    id: "network",
    q: "“Couldn't reach Yapin'” or “Failed to fetch”",
    keywords: "network cors offline blocked adblock extension vpn firewall failed to fetch",
    a: (
      <>
        <p>The request never got to Yapin'. Usually something local is in the way:</p>
        <ul className="help-list">
          <li>An ad blocker or privacy extension — allow yaphook.dev, or try a private window with extensions off.</li>
          <li>A VPN, school or work network that blocks the domain.</li>
          <li>You're offline, or Yapin' itself is down — open <Ext href="https://yapin.gg">yapin.gg</Ext> to check.</li>
        </ul>
        <p>
          Your messages are safe while you sort it out: they're saved in this browser and will still be here when you
          come back.
        </p>
      </>
    ),
  },
  {
    id: "rate",
    q: "I'm being rate limited",
    keywords: "429 rate limit slow down retry wait too fast",
    a: (
      <p>
        Yapin' limits how fast a webhook can post. YapHook notices, waits the time it's told to, and retries up to a few
        times before giving up. If it still fails, wait a minute — and bear in mind that sending five messages to three
        webhooks is fifteen posts in a row.
      </p>
    ),
  },
  {
    id: "rejected",
    q: "Yapin' rejected my message",
    keywords: "400 bad request invalid form body rejected refused embed",
    a: (
      <>
        <p>
          The message left your browser but Yapin' wouldn't accept it. The usual culprits are an image or icon URL it
          can't load, an embed with nothing visible in it, or text that's over a limit in a way YapHook didn't catch.
        </p>
        <p>
          Open the message's <strong>JSON</strong> dialog to see exactly what was sent — that normally makes the odd one
          out obvious.
        </p>
      </>
    ),
  },
  {
    id: "empty",
    q: "“Needs content or at least one embed”",
    keywords: "empty message blank validation issue content embed required",
    a: (
      <p>
        A webhook message can't be completely empty. Type something in <strong>Content</strong>, or add an embed with at
        least a title, description, field, image or footer. An embed that only has a colour counts as empty.
      </p>
    ),
  },
  {
    id: "image",
    q: "My image or avatar doesn't show up",
    keywords: "image broken thumbnail avatar icon url png jpg gif webp hotlink imgur google drive",
    a: (
      <>
        <p>
          Every image field takes a <strong>direct link to the image file</strong> — one that ends in{" "}
          <code>.png</code>, <code>.jpg</code>, <code>.gif</code> or <code>.webp</code> — not a link to a page that
          shows it.
        </p>
        <ul className="help-list">
          <li>
            Right-click the image in your browser and choose <em>Copy image address</em>.
          </li>
          <li>
            Google Drive, Dropbox and OneDrive share links don't work; neither do pages like{" "}
            <code>imgur.com/gallery/…</code>. Upload the image to a Yapin' channel and copy its address instead.
          </li>
          <li>
            The link has to be public. If it needs a login or is behind Cloudflare protection, Yapin' can't fetch it.
          </li>
          <li>Broken links are simply dropped in the preview, which is the quickest way to spot them.</li>
        </ul>
      </>
    ),
  },
  {
    id: "files",
    q: "Can I attach a file?",
    keywords: "attachment upload file image attach photo video",
    a: (
      <p>
        No — YapHook sends JSON, not uploads. To show an image, host it somewhere public (uploading it to a Yapin'
        channel works nicely) and paste its direct link into the <Jump to="images">Image</Jump> or Thumbnail field.
      </p>
    ),
  },
  {
    id: "edit",
    q: "Can I edit or delete a message after sending?",
    keywords: "edit delete update remove sent message mistake undo",
    a: (
      <p>
        Not from YapHook. Yapin's webhook API only accepts new messages, so there's nothing to edit or delete through.
        Delete the message in Yapin' itself (with the right permissions) and send a corrected one. This is why the
        preview is worth a glance first.
      </p>
    ),
  },
  {
    id: "mentions",
    q: "My ping doesn't actually ping anyone",
    keywords: "mention ping role user everyone here id placeholder notify",
    a: (
      <>
        <p>
          Mentions need the numeric id, not the name: <code>&lt;@123…&gt;</code> for a person,{" "}
          <code>&lt;@&amp;123…&gt;</code> for a role. Typing <code>@someone</code> is just text.
        </p>
        <p>
          The preview can't look ids up, so it shows a neutral <em>@user</em> chip — that's expected, and the real
          message resolves the id properly.
        </p>
        <p>
          <code>@everyone</code> and <code>@here</code> only work if the webhook's channel allows them.
        </p>
      </>
    ),
  },
  {
    id: "emoji",
    q: "Custom emoji look wrong in the preview",
    keywords: "emoji custom unicode animated preview",
    a: (
      <p>
        Plain Unicode emoji work everywhere. Custom emoji use the <code>&lt;:name:id&gt;</code> form (with an extra{" "}
        <code>a</code> for animated ones) — paste one straight from Yapin' to get it right. The preview shows that text
        as-is rather than the picture; the sent message is unaffected.
      </p>
    ),
  },
  {
    id: "preview-differs",
    q: "The preview doesn't look exactly like Yapin'",
    keywords: "preview different fonts spacing accurate render mismatch",
    a: (
      <p>
        The preview is a faithful copy, not a perfect one: fonts, emoji artwork and your theme all differ slightly, and
        custom emoji, real mentions and link previews can only be rendered by Yapin' itself. Structure, formatting,
        limits and field layout are accurate.
      </p>
    ),
  },
  {
    id: "lost-work",
    q: "My message vanished, or I want it back",
    keywords: "lost work autosave clear restore backup private window storage history",
    a: (
      <>
        <p>
          YapHook saves to this browser's local storage as you type and reloads it next time. Work disappears if you:
        </p>
        <ul className="help-list">
          <li>
            pressed <strong>Clear</strong> (it can't be undone — there's no history),
          </li>
          <li>cleared site data, or used a private window that forgot everything on close,</li>
          <li>switched browser, device or profile — storage doesn't travel.</li>
        </ul>
        <p>
          For anything you'd hate to retype, keep a copy: <strong>JSON</strong> in the top bar gives you a backup you
          can paste back in, and <strong>Share</strong> gives you a link that carries the whole message.
        </p>
      </>
    ),
  },
  {
    id: "share-long",
    q: "My share link is enormous",
    keywords: "share link long url truncated chat too big",
    a: (
      <p>
        The entire message is encoded in the link, so a big one makes a long link. Some apps cut long links when they
        post them — if a share link doesn't load, it was probably truncated in transit. Send a{" "}
        <Jump to="sharing">JSON backup</Jump> as a file or code block instead.
      </p>
    ),
  },
  {
    id: "multiple",
    q: "How do I post the same thing in several channels?",
    keywords: "multiple webhooks channels broadcast several at once order",
    a: (
      <p>
        Make a webhook in each channel, then press <strong>Add webhook</strong> for each URL. One press of Send posts
        every message to every webhook, webhook by webhook, in order. Only webhooks showing a green name are used.
      </p>
    ),
  },
  {
    id: "mobile",
    q: "I can't see the preview on my phone",
    keywords: "mobile phone tablet preview tabs small screen responsive",
    a: (
      <p>
        On narrow screens the editor and preview become tabs — use the <strong>Editor</strong> / <strong>Preview</strong>{" "}
        switch under the header. JSON, Share and Clear move to the bottom of the editor.
      </p>
    ),
  },
  {
    id: "stuck",
    q: "None of this helped",
    keywords: "support help contact server bug report issue",
    a: (
      <p>
        <Ext href={SERVER}>Join the YapHook server</Ext> and describe what you did, what you expected and the exact red
        error text. A screenshot of the builder and the output of the message's <strong>JSON</strong> dialog help a lot —
        just never paste your webhook URL, since that lets anyone post in your channel.
      </p>
    ),
  },
];

/* ---------------- search ---------------- */

/** Flattens static JSX to text so the search box can match on content, not just headings. */
function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join(" ");
  if (typeof node === "object" && "props" in node) {
    const p = node.props as Record<string, unknown>;
    const own = ["text", "title", "label", "q", "blurb", "keywords", "to", "href"]
      .map((k) => (typeof p[k] === "string" ? (p[k] as string) : ""))
      .join(" ");
    return `${own} ${nodeText(p.children as ReactNode)}`;
  }
  return "";
}

const faqText = (f: Faq) => `${f.q} ${f.keywords ?? ""} ${nodeText(f.a)}`;

/* ---------------- page ---------------- */

export function Help({
  onOpenBuilder,
  onLoadExample,
}: {
  onOpenBuilder: () => void;
  onLoadExample: (messages: MessageS[], name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("start");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const now = Math.floor(Date.now() / 1000);

  const terms = useMemo(
    () =>
      query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [query],
  );
  const hit = (text: string) => terms.every((t) => text.toLowerCase().includes(t));

  const faqs = useMemo(() => {
    if (!terms.length) return FAQ;
    const matched = FAQ.filter((f) => hit(faqText(f)));
    // "troubleshooting" and friends match the section itself: then keep everything.
    return matched.length ? matched : FAQ;
  }, [terms.join(" ")]);

  const sections: { id: string; title: string; body: ReactNode }[] = [
    {
      id: "start",
      title: "Quick start",
      body: (
        <>
          <ol className="steps">
            <li>
              <strong>Create a webhook in Yapin'.</strong> Open the channel you want to post in, go to its settings,
              find <strong>Webhooks</strong>, create one and copy its URL. It looks like
              <code className="url">https://www.yapin.gg/api/webhooks/&lt;id&gt;/&lt;token&gt;</code>
              <span className="step-note">
                No Webhooks option? You don't have permission in that server — ask an admin.{" "}
                <Jump to="faq-find-webhook">More</Jump>
              </span>
            </li>
            <li>
              <strong>Paste it into the Webhooks box.</strong> YapHook checks it as you paste and shows the webhook's
              name with <em>ready to send</em> once it works. Red text underneath says precisely what's wrong, so read
              it before trying again.
            </li>
            <li>
              <strong>Write your message.</strong> Type into <em>Content</em>, or press <em>Add embed</em> for a card
              with a coloured sidebar. The preview on the right updates as you type — on a phone, switch to the{" "}
              <em>Preview</em> tab.
            </li>
            <li>
              <strong>Clear any issues.</strong> If a red box appears under the editor, it lists everything stopping the
              send. Send stays available but will refuse until the list is empty.
            </li>
            <li>
              <strong>Send.</strong> <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> works too. Every message goes to every valid
              webhook, in order — and <strong>can't be edited or deleted afterwards</strong>, so glance at the preview
              first.
            </li>
          </ol>

          <Callout kind="stuck" title="Stuck on the very first step?">
            <p>
              Nothing in YapHook works until the Webhooks box turns green, and that box is where most people get stuck.
              The three usual reasons:
            </p>
            <ul className="help-list">
              <li>
                <Jump to="faq-url">The URL was copied incompletely</Jump> — the giveaway is a “…” in the middle.
              </li>
              <li>
                <Jump to="faq-wrong-site">It's a Discord webhook</Jump> — YapHook can only talk to Yapin'.
              </li>
              <li>
                <Jump to="faq-token">The webhook was deleted or its token reset</Jump> — copy a fresh URL.
              </li>
            </ul>
          </Callout>

          <p>
            Prefer to start from something that already works? <Jump to="examples">Load an example</Jump> and change it.
          </p>
        </>
      ),
    },
    {
      id: "webhooks",
      title: "Webhooks, explained",
      body: (
        <>
          <p>
            A webhook is a private URL that posts into one Yapin' channel. Anything that can make a web request can use
            it — no bot, no account, no login. YapHook is just a nice front end for that URL.
          </p>

          <h3 id="help-webhook-url">What the URL is made of</h3>
          <table className="help-table">
            <tbody>
              <tr>
                <td>
                  <code className="src">https://www.yapin.gg/api/webhooks/</code>
                </td>
                <td>Always the same. YapHook rewrites bare <code>yapin.gg</code> to <code>www</code> for you.</td>
              </tr>
              <tr>
                <td>
                  <code className="src">&lt;id&gt;</code>
                </td>
                <td>Which webhook it is. Not secret on its own.</td>
              </tr>
              <tr>
                <td>
                  <code className="src">&lt;token&gt;</code>
                </td>
                <td>
                  The long part at the end — the password. Anyone holding it can post in your channel as that webhook.
                </td>
              </tr>
            </tbody>
          </table>

          <h3>While you're using it</h3>
          <ul className="help-list">
            <li>The box masks the URL and only reveals it while focused, so it's safe to share your screen.</li>
            <li>
              It's stored in this browser and nowhere else. It is <strong>never</strong> part of a share link or a JSON
              backup.
            </li>
            <li>
              YapHook fetches the webhook's name and avatar to confirm it works, then sends through the canonical{" "}
              <code>www.yapin.gg</code> address.
            </li>
            <li>
              Leaked one? Delete or regenerate it in Yapin'. Old URLs stop working the moment the token changes.
            </li>
          </ul>

          <h3>What a webhook can't do</h3>
          <p>
            It can only post new messages into its own channel. It can't read messages, edit or delete what it sent, add
            reactions, or post anywhere else. That's a limit of the API, not of YapHook.
          </p>
        </>
      ),
    },
    {
      id: "building",
      title: "Building messages",
      body: (
        <>
          <p>
            Every card in the editor collapses, so a long message stays manageable. A message needs{" "}
            <strong>content, an embed, or both</strong> — it can't be empty.
          </p>

          <h3 id="help-content">Content</h3>
          <p>
            The plain text above any embeds, up to {LIMITS.content.toLocaleString()} characters, with the{" "}
            <Jump to="formatting">full formatting set</Jump>. Good for a short note or the ping that accompanies an
            embed.
          </p>

          <h3 id="help-profile">Profile</h3>
          <p>
            Overrides the username and avatar for <em>this message only</em>. Leave both blank to use the webhook's own
            name and picture. The avatar takes a <Jump to="faq-image">direct image link</Jump>. Nothing stops two
            messages using two different identities — that's how people fake a conversation between characters.
          </p>

          <h3 id="help-embeds">Embeds</h3>
          <p>
            Cards with a coloured sidebar, up to {LIMITS.embeds} per message. Each one can have an author line, a title
            (optionally a link), a description, fields, a big image, a thumbnail, a footer and a timestamp. Use the
            arrows to reorder, the copy button to duplicate, and the colour swatches for a quick sidebar colour.
          </p>
          <p>
            Only the description takes block formatting such as headings, lists and quotes. Titles, author names, field
            names and footers are better treated as plain text.
          </p>

          <h3 id="help-fields">Fields</h3>
          <p>
            Name/value pairs inside an embed, up to {LIMITS.fields}. Both halves are required — a field with only a name
            shows as an issue. Turn on <em>Inline</em> to put fields side by side: three per row, or two when the embed
            has a thumbnail. Mixing inline and full-width fields is how most tidy layouts are built.
          </p>

          <h3 id="help-images">Images</h3>
          <p>
            <strong>Image</strong> is the wide picture at the bottom of the embed; <strong>Thumbnail</strong> is the
            small one in the top-right corner. Both need a direct link to the file itself — see{" "}
            <Jump to="faq-image">why an image might not show</Jump>. YapHook can't upload files.
          </p>

          <h3 id="help-footer">Footer &amp; timestamp</h3>
          <p>
            The footer sits at the bottom in small text, with an optional icon (which needs footer text to appear). The
            timestamp is shown next to it in each reader's own time zone — press <em>Now</em> for the current moment, or
            the ✕ to remove it. For a date in the middle of a sentence, use a{" "}
            <Jump to="timestamps">
              <code>&lt;t:…&gt;</code> timestamp
            </Jump>{" "}
            instead.
          </p>

          <h3 id="help-multiple">Several messages at once</h3>
          <p>
            <em>Add message</em> queues another message. They're sent top to bottom, which is how you post a banner
            followed by a note, or split a wall of text. Consecutive messages with the same profile are grouped in the
            preview, exactly as a chat client would.
          </p>
        </>
      ),
    },
    {
      id: "formatting",
      title: "Formatting",
      body: (
        <>
          <p>
            Works in message content, embed descriptions and field values. Everything below is live — this is the same
            renderer the preview uses.
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

          <h3 id="help-timestamps">Timestamps</h3>
          <p>
            <code>&lt;t:UNIX:STYLE&gt;</code> renders a date in each reader's local time — ideal for events across time
            zones. Right now <code>{now}</code> is the Unix time, and the style is one letter:
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
          <p className="muted">
            Need a Unix number for a specific date? Set the embed timestamp with the date picker, open the message's JSON
            and read the ISO date — or search the web for “unix timestamp converter”.
          </p>

          <h3 id="help-mentions">Mentions &amp; emoji</h3>
          <table className="help-table">
            <thead>
              <tr>
                <th>You type</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {MENTIONS.map(([src, what]) => (
                <tr key={src}>
                  <td>
                    <code className="src">{src}</code>
                  </td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Ids are the long numbers, not names — see <Jump to="faq-mentions">why a ping might not fire</Jump>. Unicode
            emoji can be typed or pasted; <Jump to="faq-emoji">custom emoji</Jump> use the{" "}
            <code>&lt;:name:id&gt;</code> form.
          </p>

          <h3>Where formatting doesn't apply</h3>
          <ul className="help-list">
            <li>Usernames, embed titles, author names, field names and footers: treat them as plain text.</li>
            <li>Block styles (headings, lists, quotes, code blocks) only render in content and embed descriptions.</li>
            <li>
              Escape a character you want to show literally with a backslash: <code>\*not italic\*</code>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "examples",
      title: "Examples you can load",
      body: (
        <>
          <p>
            Each of these opens in the builder, ready to edit. <strong>Loading one replaces your current messages</strong>{" "}
            — YapHook asks first, and you can always take a <Jump to="sharing">JSON backup</Jump> beforehand.
          </p>
          <div className="examples">
            {EXAMPLES.map((ex) => (
              <div className="example" key={ex.id}>
                <div className="example-name">{ex.name}</div>
                <p>{ex.blurb}</p>
                <button type="button" className="btn ghost sm" onClick={() => onLoadExample(ex.build(), ex.name)}>
                  <Icon name="edit" /> Load in builder
                </button>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "limits",
      title: "Limits",
      body: (
        <>
          <p>
            YapHook counts as you type, turns the counter amber near a limit and red over it, and refuses to send while
            anything is over.
          </p>
          <table className="help-table compact">
            <tbody>
              {LIMIT_ROWS.map(([label, n]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="num">{n.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            The combined {LIMITS.embedTotal.toLocaleString()}-character ceiling is the one that catches people out: it
            adds up titles, descriptions, author names, footers and every field across all embeds in a message. Each
            embed shows its own running total at the bottom of its card. If you hit it, split the content into a second
            message.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "Saving, sharing & JSON",
      body: (
        <>
          <h3 id="help-autosave">Autosave</h3>
          <p>
            Messages and webhook URLs are saved to this browser as you work and restored next time you visit. They don't
            follow you to another browser or device, and <strong>Clear</strong> can't be undone — see{" "}
            <Jump to="faq-lost-work">getting work back</Jump>.
          </p>

          <h3 id="help-share">Share</h3>
          <p>
            Copies a link with the whole message packed into it. Anyone who opens it gets an editable copy in their own
            builder; nothing is uploaded anywhere. <strong>Webhook URLs are never included</strong>, so a share link is
            safe to post — but remember the message text itself is in the link.
          </p>

          <h3 id="help-json">JSON</h3>
          <dl className="help-dl">
            <dt>JSON (top bar)</dt>
            <dd>
              A backup of every message. Paste one back in to restore it. Discohook backups and share data import too,
              so you can move work between the two tools.
            </dd>
            <dt>JSON (per message)</dt>
            <dd>
              The exact payload sent to Yapin'. Paste in a payload from a bot, script or docs page to load it into the
              editor — handy for reverse-engineering a message someone else built.
            </dd>
          </dl>
          <p>Payloads use the same shape Discord webhooks do, so you can send them from anywhere:</p>
          <pre className="md-pre">
            <code>{`curl -X POST "https://www.yapin.gg/api/webhooks/<id>/<token>" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello!", "embeds": [{"title": "Hi", "color": 16739146}]}'`}</code>
          </pre>
          <p className="muted">
            Colours are decimal, not hex: <code>#ff6b4a</code> is <code>16739146</code>. The editor converts for you.
          </p>
        </>
      ),
    },
    {
      id: "shortcuts",
      title: "Shortcuts & small print",
      body: (
        <>
          <table className="help-table">
            <tbody>
              <tr>
                <td>
                  <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> <span className="muted">or</span> <Kbd>⌘</Kbd> + <Kbd>Enter</Kbd>
                </td>
                <td>Send</td>
              </tr>
              <tr>
                <td>
                  <Kbd>?</Kbd>
                </td>
                <td>Open this help page</td>
              </tr>
              <tr>
                <td>
                  <Kbd>Esc</Kbd>
                </td>
                <td>Close the JSON dialog</td>
              </tr>
            </tbody>
          </table>
          <ul className="help-list">
            <li>Every card header collapses — click the title to fold a finished embed out of the way.</li>
            <li>
              The copy button duplicates a message, embed or field, which beats retyping a similar one; the arrows
              reorder.
            </li>
            <li>
              Any <Icon name="question" size={13} /> in the editor jumps straight to the matching part of this page.
            </li>
            <li>Narrow screens get Editor/Preview tabs under the header.</li>
          </ul>
        </>
      ),
    },
    {
      id: "privacy",
      title: "Privacy & safety",
      body: (
        <ul className="help-list">
          <li>
            YapHook is a static site with no backend. There's no account, no analytics and no server of ours that your
            messages or webhook URLs ever touch.
          </li>
          <li>Messages go straight from your browser to Yapin'. Your IP address is visible to Yapin', as with any request you make to it.</li>
          <li>
            Messages and webhook URLs live in this browser's local storage. Clearing site data, or using a private
            window, wipes them.
          </li>
          <li>
            <strong>Treat a webhook URL like a password.</strong> Anyone with it can post in your channel. Never paste
            one into a bug report, screenshot or chat message.
          </li>
          <li>
            Preview images load from whatever URLs you type, so those hosts can see your IP address. The same is true
            for everyone who later reads the sent message.
          </li>
          <li>
            Share links carry your message text in the URL. Don't put anything private in a message you then share as a
            link.
          </li>
        </ul>
      ),
    },
    {
      id: "faq",
      title: "Troubleshooting",
      body: (
        <>
          <p className="muted">
            {terms.length ? `${faqs.length} of ${FAQ.length} entries match.` : "Click a question to open it."}
          </p>
          <div className="faqs">
            {faqs.map((f) => (
              <details
                key={f.id}
                id={`help-faq-${f.id}`}
                className="faq"
                open={openFaq === f.id || terms.length > 0}
              >
                <summary>{f.q}</summary>
                <div className="faq-body">{f.a}</div>
              </details>
            ))}
          </div>
        </>
      ),
    },
  ];

  const visible = terms.length
    ? sections.filter((s) =>
        hit(`${s.title} ${nodeText(s.body)} ${s.id === "faq" ? FAQ.map(faqText).join(" ") : ""}`),
      )
    : sections;

  // Deep links: #help/<section>, #help/<sub-heading> or #help/faq-<entry>.
  useEffect(() => {
    const go = () => {
      const target = decodeURIComponent(location.hash.replace(/^#help\/?/, ""));
      if (!target) return;
      if (target.startsWith("faq-")) setOpenFaq(target.slice(4));
      setQuery("");
      setActive(target.startsWith("faq-") ? "faq" : target);
      requestAnimationFrame(() => {
        const el = document.getElementById(`help-${target}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (!el) document.querySelector(".help-pane")?.scrollTo({ top: 0 });
      });
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  // Highlight the section you're reading.
  const visibleIds = visible.map((s) => s.id).join(",");
  useEffect(() => {
    const els = visible.map((s) => document.getElementById(`help-${s.id}`)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("help-", ""));
      },
      { rootMargin: "0px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [visibleIds]);

  const jump = (id: string) => {
    setQuery("");
    history.replaceState(null, "", `#help/${id}`);
    setActive(id);
    document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="help">
      <nav className="help-toc" aria-label="Help sections">
        <span className="help-toc-title">On this page</span>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`${active === s.id ? "on" : ""}${terms.length && !visible.some((v) => v.id === s.id) ? " dim" : ""}`}
            onClick={() => jump(s.id)}
          >
            {s.title}
          </button>
        ))}
        <a className="help-toc-server" href={SERVER} target="_blank" rel="noreferrer">
          <Icon name="external" size={13} /> Ask in the server
        </a>
      </nav>

      <article className="help-body">
        <header className="help-hero">
          <h1>YapHook help</h1>
          <p>
            YapHook builds and sends messages through <strong>Yapin'</strong> webhooks: rich embeds, custom names and
            avatars, several messages at once. No account or bot needed.
          </p>

          <div className="help-search">
            <Icon name="search" size={16} />
            <input
              className="input"
              type="search"
              value={query}
              placeholder="Search help — try “image”, “token”, “timestamp”…"
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search help"
            />
            {query && (
              <button type="button" className="icon-btn" onClick={() => setQuery("")} aria-label="Clear search">
                <Icon name="x" />
              </button>
            )}
          </div>

          {terms.length ? (
            <p className="help-results">
              {visible.length ? `${visible.length} section${visible.length === 1 ? "" : "s"} match` : "No matches"} for “
              {query.trim()}”
            </p>
          ) : (
            <div className="help-hero-actions">
              <button type="button" className="btn primary" onClick={onOpenBuilder}>
                <Icon name="edit" /> Open the builder
              </button>
              <button type="button" className="btn ghost" onClick={() => jump("examples")}>
                <Icon name="book" /> Load an example
              </button>
              <button type="button" className="btn ghost" onClick={() => jump("faq")}>
                <Icon name="question" /> Something's broken
              </button>
            </div>
          )}
        </header>

        {visible.map((s) => (
          <Section key={s.id} id={s.id} title={s.title}>
            {s.body}
          </Section>
        ))}

        {!visible.length && (
          <Callout kind="stuck" title="Nothing matched that">
            <p>
              Try a shorter word, browse <Jump to="faq">Troubleshooting</Jump>, or{" "}
              <Ext href={SERVER}>ask in the YapHook server</Ext> — someone there has probably hit the same thing.
            </p>
          </Callout>
        )}

        <Callout kind="stuck" title="Still stuck?">
          <p>
            <Ext href={SERVER}>Join the YapHook server</Ext> and say what you tried, what you expected, and the exact
            red error text. Never post your webhook URL — regenerate it in Yapin' if you already have.
          </p>
        </Callout>

        <footer className="credits">
          YapHook is an unofficial community tool for <Ext href="https://yapin.gg">Yapin'</Ext>, inspired by{" "}
          <Ext href="https://github.com/discohook/discohook">Discohook</Ext>.
        </footer>
      </article>
    </div>
  );
}
