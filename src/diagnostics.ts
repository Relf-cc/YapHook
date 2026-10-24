// Plain-English explanations for everything that can go wrong, so the UI can say
// what to do instead of echoing "Invalid Webhook Token". `help` is the id of a
// troubleshooting entry on the help page (`#help/<help>`).

export interface Diagnosis {
  /** What is wrong, in one short line. */
  message: string;
  /** What to do about it. */
  fix?: string;
  /** Help anchor, e.g. "faq-token". */
  help?: string;
}

const YAPIN_HOST = /^(?:www\.)?(?:yapin\.gg|yapper\.website)$/i;

/** Why a pasted string isn't a usable webhook URL. Only call when parsing failed. */
export function explainWebhookUrl(raw: string): Diagnosis {
  const url = raw.trim();
  const low = url.toLowerCase();

  if (/discord(?:app)?\.com|discord\.gg/.test(low))
    return {
      message: "That's a Discord webhook, not a Yapin' one",
      fix: "YapHook only sends through Yapin'. Create a webhook in your Yapin' server and paste that URL instead.",
      help: "faq-wrong-site",
    };

  if (/…|\.\.\./.test(url))
    return {
      message: "The URL is cut short — it still contains “…”",
      fix: "Use the copy button in Yapin' rather than selecting the shortened text you see on screen.",
      help: "faq-url",
    };

  if (!/^https?:\/\//i.test(low))
    return /webhooks?\//.test(low) || /^[\w-]{5,}\/[\w-]{10,}$/.test(url)
      ? {
          message: "The start of the URL is missing",
          fix: "Paste the whole thing, beginning with https://www.yapin.gg/api/webhooks/.",
          help: "faq-url",
        }
      : {
          message: "That doesn't look like a webhook URL",
          fix: "A webhook URL looks like https://www.yapin.gg/api/webhooks/<id>/<token>. Copy it from the channel's webhook settings.",
          help: "faq-find-webhook",
        };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      message: "That isn't a complete URL",
      fix: "Check for stray spaces or line breaks, then paste it again.",
      help: "faq-url",
    };
  }

  if (!YAPIN_HOST.test(parsed.hostname))
    return {
      message: `${parsed.hostname} isn't Yapin'`,
      fix: "Yapin' webhook URLs start with https://www.yapin.gg/api/webhooks/.",
      help: "faq-wrong-site",
    };

  const parts = parsed.pathname.split("/").filter(Boolean);
  const at = parts.indexOf("webhooks");
  if (at < 0 || parts[0] !== "api")
    return {
      message: "That's a Yapin' link, but not a webhook URL",
      fix: "In Yapin', open the channel's settings → Webhooks, then copy the webhook's URL.",
      help: "faq-find-webhook",
    };

  const rest = parts.slice(at + 1);
  if (rest.length < 2)
    return {
      message: "The URL is missing its token",
      fix: "There are two parts after /webhooks/: the id and the token. Copy the URL again — it was probably truncated.",
      help: "faq-url",
    };
  if (rest.length > 2)
    return {
      message: "There's something extra after the token",
      fix: "The URL should end right after the token.",
      help: "faq-url",
    };

  return {
    message: "The id or token contains characters that don't belong",
    fix: "Copy the URL again. Ids and tokens are only letters, numbers, dashes and underscores.",
    help: "faq-url",
  };
}

/** Turns an API or network error into something actionable. */
export function explainApiError(raw: string): Diagnosis {
  const m = (raw || "").toLowerCase();

  if (/failed to fetch|networkerror|network error|load failed|fetch failed|err_/.test(m))
    return {
      message: "Couldn't reach Yapin'",
      fix: "Check your connection. Ad blockers, privacy extensions and some VPNs block this request too — try disabling them for yaphook.dev, or use another browser.",
      help: "faq-network",
    };

  if (/invalid webhook token|50027|unauthoriz|http 401/.test(m))
    return {
      message: "Yapin' rejected the webhook's token",
      fix: "The token was reset, or part of the URL is wrong. Copy a fresh URL from the channel's webhook settings.",
      help: "faq-token",
    };

  if (/not found|unknown webhook|10015|http 404/.test(m))
    return {
      message: "That webhook doesn't exist any more",
      fix: "It was deleted, or so was its channel. Create a new webhook in Yapin' and paste the new URL.",
      help: "faq-token",
    };

  if (/forbidden|http 403|missing access|missing permissions/.test(m))
    return {
      message: "Yapin' refused the request",
      fix: "The webhook may be disabled or its channel is gone. Check it in Yapin', or make a new one.",
      help: "faq-token",
    };

  if (/rate limit|429|try again in a moment/.test(m))
    return {
      message: "Sending too fast",
      fix: "YapHook already waits and retries. Give it a minute, or send fewer messages and webhooks at once.",
      help: "faq-rate",
    };

  if (/http 5\d\d|internal server|bad gateway|gateway time/.test(m))
    return {
      message: "Yapin' had a server error",
      fix: "Nothing is wrong on your side. Try again in a minute.",
      help: "faq-network",
    };

  if (/empty message|cannot send|invalid form|http 400/.test(m))
    return {
      message: `Yapin' rejected the message: ${raw}`,
      fix: "Usually an image URL Yapin' can't load, or an empty embed. Fix the issues listed under the editor and send again.",
      help: "faq-rejected",
    };

  return {
    message: raw || "Something went wrong",
    fix: "If it keeps happening, copy this message into the YapHook server and someone will take a look.",
    help: "faq-stuck",
  };
}

/** One-line form for toasts. */
export const diagnosisLine = (d: Diagnosis) => (d.fix ? `${d.message} — ${d.fix}` : d.message);
