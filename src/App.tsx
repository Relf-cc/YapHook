import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageS,
  TargetS,
  cloneMessage,
  newMessage,
  parseAny,
  postMessage,
  readShared,
  shareUrl,
  toBackup,
  toPayload,
  uid,
  validateMessage,
  webhookApiUrl,
} from "./model";
import { explainApiError } from "./diagnostics";
import { KEYS, load, save } from "./storage";
import { welcome } from "./welcome";
import { MessageEditor, move } from "./components/Editor";
import { Guide, GuideStep } from "./components/Guide";
import { Help } from "./components/Help";
import { JsonModal, JsonModalSpec } from "./components/JsonModal";
import { Preview } from "./components/Preview";
import { InfoState, Targets } from "./components/Targets";
import { Toasts, useToasts } from "./components/Toasts";
import { HelpLink, Icon } from "./components/ui";

type View = "builder" | "help";
type GuideState = { hidden?: boolean; sent?: boolean };
type Problem = { label: string; message: string; fix?: string; help?: string };
type Report = { ok: number; fail: number; problems: Problem[] };

// Read once at startup; the hash is cleared after loading so reloads don't re-import.
const SHARED = readShared();

function initialMessages(): MessageS[] {
  if (SHARED?.length) return SHARED;
  const saved = load<unknown>(KEYS.messages);
  if (saved) {
    try {
      const msgs = parseAny(saved);
      if (msgs.length) return msgs;
    } catch {
      /* corrupt save, fall back to welcome */
    }
  }
  return welcome();
}

function initialTargets(): TargetS[] {
  const saved = load<string[]>(KEYS.targets);
  const urls = Array.isArray(saved) && saved.length ? saved : [""];
  return urls.map((url) => ({ id: uid(), url: String(url) }));
}

const viewFromHash = (): View => (location.hash.startsWith("#help") ? "help" : "builder");

export default function App() {
  const [messages, setMessages] = useState<MessageS[]>(initialMessages);
  const [targets, setTargets] = useState<TargetS[]>(initialTargets);
  const [infos, setInfos] = useState<Record<string, InfoState>>({});
  const [view, setView] = useState<View>(viewFromHash);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [modal, setModal] = useState<JsonModalSpec | null>(null);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [guide, setGuide] = useState<GuideState>(() => load<GuideState>(KEYS.guide) ?? {});
  const { toasts, push, dismiss } = useToasts();

  useEffect(() => {
    if (!SHARED) return;
    push("info", "Loaded message from share link");
    history.replaceState(null, "", location.pathname);
  }, [push]);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTo = useCallback((v: View, section?: string) => {
    history.pushState(null, "", v === "help" ? `#help${section ? `/${section}` : ""}` : location.pathname);
    setView(v);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.messages, toBackup(messages)), 250);
    return () => clearTimeout(t);
  }, [messages]);
  useEffect(() => save(KEYS.targets, targets.map((t) => t.url).filter(Boolean)), [targets]);

  const setGuideState = (p: Partial<GuideState>) =>
    setGuide((g) => {
      const next = { ...g, ...p };
      save(KEYS.guide, next);
      return next;
    });

  const onInfo = useCallback((id: string, s: InfoState) => setInfos((m) => ({ ...m, [id]: s })), []);

  const errors = useMemo(
    () =>
      messages.flatMap((m, i) => validateMessage(m).map((e) => (messages.length > 1 ? `Message ${i + 1}: ${e}` : e))),
    [messages],
  );
  const ready = targets.filter((t) => infos[t.id]?.status === "ok" && webhookApiUrl(t.url));
  const firstInfo = ready.length ? infos[ready[0].id].info : undefined;

  const send = async () => {
    if (!ready.length) {
      setReport({
        ok: 0,
        fail: 0,
        problems: [
          {
            label: "No webhook yet",
            message: "YapHook doesn't know where to post.",
            fix: "Paste a Yapin' webhook URL into the Webhooks box above and wait for it to show a green name.",
            help: "faq-find-webhook",
          },
        ],
      });
      return push("err", "Add a valid Yapin' webhook URL first");
    }
    if (errors.length) {
      setReport(null);
      return push("err", `Fix before sending: ${errors[0]}`);
    }

    setSending(true);
    setReport(null);
    const problems: Problem[] = [];
    let ok = 0;
    for (const t of ready) {
      for (const [i, m] of messages.entries()) {
        try {
          await postMessage(webhookApiUrl(t.url)!, toPayload(m));
          ok++;
        } catch (e) {
          const d = explainApiError((e as Error).message);
          problems.push({
            label: `Message ${i + 1} → ${infos[t.id]?.info?.name ?? "webhook"}`,
            message: d.message,
            fix: d.fix,
            help: d.help,
          });
        }
      }
    }
    setSending(false);

    if (problems.length) {
      setReport({ ok, fail: problems.length, problems: problems.slice(0, 5) });
      push("err", problems[0].message);
    }
    if (ok) {
      push("ok", `Sent ${ok} message${ok === 1 ? "" : "s"}${problems.length ? ` · ${problems.length} failed` : ""}`);
      if (!guide.sent) setGuideState({ sent: true });
    }
  };

  const share = async () => {
    const url = shareUrl(messages);
    try {
      // Some browsers leave the clipboard promise pending behind a permission prompt.
      await Promise.race([
        navigator.clipboard.writeText(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("clipboard timeout")), 1500)),
      ]);
      push("ok", "Share link copied. Webhook URLs are never included.");
    } catch {
      window.prompt("Copy this share link:", url);
    }
  };

  const editAllJson = () =>
    setModal({
      title: "Backup / import JSON",
      text: JSON.stringify(toBackup(messages), null, 2),
      apply: (text) => {
        const msgs = parseAny(JSON.parse(text));
        if (!msgs.length) throw new Error("No messages found");
        setMessages(msgs);
        push("ok", `Imported ${msgs.length} message${msgs.length === 1 ? "" : "s"}`);
      },
    });

  const editMessageJson = (i: number) =>
    setModal({
      title: `Message ${i + 1} JSON`,
      text: JSON.stringify(toPayload(messages[i]), null, 2),
      apply: (text) => {
        const [m] = parseAny(JSON.parse(text));
        setMessages((ms) => ms.map((x, j) => (j === i ? { ...m, id: x.id } : x)));
      },
    });

  const clearAll = () => {
    if (confirm("Clear all messages and start fresh? This can't be undone — take a JSON backup first if you need one."))
      setMessages([newMessage()]);
  };

  const loadExample = (msgs: MessageS[], name: string) => {
    if (!confirm(`Load the “${name}” example? It replaces the messages you have now.`)) return;
    setMessages(msgs);
    setReport(null);
    goTo("builder");
    push("ok", `Loaded “${name}” — edit anything you like`);
  };

  // Keyboard shortcuts. Refs keep the handler stable without going stale.
  const live = useRef({ send, goTo, modal });
  live.current = { send, goTo, modal };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (live.current.modal) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void live.current.send();
        return;
      }
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName));
      if (e.key === "?" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !location.hash.startsWith("#help")) {
        e.preventDefault();
        live.current.goTo("help");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasBody = messages.some((m) => m.content.trim() || m.embeds.length);
  const steps: GuideStep[] = [
    {
      label: "Add a webhook",
      hint: "Paste the URL from your Yapin' channel settings into the box below.",
      done: ready.length > 0,
      help: "faq-find-webhook",
    },
    {
      label: "Write your message",
      hint: "Type into Content, or press Add embed. The preview updates as you type.",
      done: hasBody && !errors.length,
      help: "building",
    },
    {
      label: "Send it",
      hint: "Press Send, or Ctrl+Enter. Sent messages can't be edited, so check the preview first.",
      done: !!guide.sent,
      help: "start",
    },
  ];

  return (
    <div className={`app view-${view}`}>
      <header className="top">
        <button type="button" className="brand" onClick={() => goTo("builder")} aria-label="YapHook builder">
          <img src="./favicon.svg" alt="" className="brand-logo" />
          <span className="brand-text">
            <span className="brand-name">
              Yap<span>Hook</span>
            </span>
            <span className="brand-sub">Webhook builder for Yapin'</span>
          </span>
        </button>

        <nav className="views" aria-label="Pages">
          <button type="button" className={view === "builder" ? "on" : ""} onClick={() => goTo("builder")}>
            Builder
          </button>
          <button
            type="button"
            className={view === "help" ? "on" : ""}
            onClick={() => goTo("help")}
            title="Help, formatting reference and troubleshooting (?)"
          >
            Help
          </button>
        </nav>

        {view === "builder" && (
          <>
            <nav className="tabs" aria-label="View">
              <button type="button" className={tab === "edit" ? "on" : ""} onClick={() => setTab("edit")}>
                <Icon name="edit" /> Editor
              </button>
              <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>
                <Icon name="eye" /> Preview
              </button>
            </nav>
            <div className="top-actions">
              <button type="button" className="btn ghost hide-sm" onClick={editAllJson} title="Backup / import JSON">
                <Icon name="code" /> JSON
              </button>
              <button type="button" className="btn ghost hide-sm" onClick={share} title="Copy share link">
                <Icon name="link" /> Share
              </button>
              <button type="button" className="btn ghost hide-sm" onClick={clearAll} title="Clear all messages">
                <Icon name="reset" /> Clear
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={send}
                disabled={sending}
                title={errors[0] ?? (ready.length ? "Send to webhook (Ctrl+Enter)" : "Add a webhook URL first")}
              >
                {sending ? <span className="spinner" /> : <Icon name="send" />}
                {sending ? "Sending…" : ready.length > 1 ? `Send to ${ready.length}` : "Send"}
              </button>
            </div>
          </>
        )}
      </header>

      {view === "help" ? (
        <main className="help-pane">
          <Help onOpenBuilder={() => goTo("builder")} onLoadExample={loadExample} />
        </main>
      ) : (
        <main className={`layout show-${tab}`}>
          <section className="pane editor-pane" aria-label="Editor">
            <div className="pane-inner">
              {!guide.hidden && <Guide steps={steps} onDismiss={() => setGuideState({ hidden: true })} />}

              <Targets targets={targets} setTargets={setTargets} onInfo={onInfo} />

              {messages.map((m, i) => (
                <MessageEditor
                  key={m.id}
                  message={m}
                  index={i}
                  total={messages.length}
                  onChange={(nm) => setMessages((ms) => ms.map((x, j) => (j === i ? nm : x)))}
                  onMove={(d) => setMessages((ms) => move(ms, i, d))}
                  onDuplicate={() => setMessages((ms) => [...ms.slice(0, i + 1), cloneMessage(m), ...ms.slice(i + 1)])}
                  onRemove={() => setMessages((ms) => (ms.length > 1 ? ms.filter((_, j) => j !== i) : [newMessage()]))}
                  onJson={() => editMessageJson(i)}
                />
              ))}

              <div className="row-actions">
                <button type="button" className="btn ghost" onClick={() => setMessages((ms) => [...ms, newMessage()])}>
                  <Icon name="plus" /> Add message
                </button>
                <span className="spacer" />
                <button type="button" className="btn ghost show-sm" onClick={editAllJson}>
                  <Icon name="code" /> JSON
                </button>
                <button type="button" className="btn ghost show-sm" onClick={share}>
                  <Icon name="link" /> Share
                </button>
                <button type="button" className="btn ghost show-sm" onClick={clearAll}>
                  <Icon name="reset" /> Clear
                </button>
              </div>

              {errors.length > 0 && (
                <div className="issues" role="status">
                  <div className="issues-head">
                    <Icon name="alert" size={14} /> {errors.length} issue{errors.length === 1 ? "" : "s"} to fix before
                    sending
                    <span className="spacer" />
                    <HelpLink to="limits" text="What do these mean?" label="Help with limits and issues" />
                  </div>
                  <ul>
                    {errors.slice(0, 8).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report && (
                <div className="issues report" role="status">
                  <div className="issues-head">
                    <Icon name="alert" size={14} />{" "}
                    {report.ok
                      ? `Sent ${report.ok}, but ${report.fail} failed`
                      : report.fail
                        ? "Nothing was sent"
                        : "Can't send yet"}
                    <span className="spacer" />
                    <button type="button" className="help-link" onClick={() => setReport(null)}>
                      Dismiss
                    </button>
                  </div>
                  <ul>
                    {report.problems.map((p, i) => (
                      <li key={i}>
                        <strong>{p.label}:</strong> {p.message}
                        {p.fix && (
                          <span className="report-fix">
                            {p.fix} {p.help && <HelpLink to={p.help} text="Open help" label="Open help" />}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <footer className="credits">
                Unofficial community tool for{" "}
                <a href="https://yapin.gg" target="_blank" rel="noreferrer">
                  Yapin'
                </a>
                . Everything stays in your browser.{" "}
                <a
                  href="#help"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo("help");
                  }}
                >
                  Help &amp; formatting guide
                </a>
                {" · "}
                <a href="https://yapin.gg/invite/yaphook" target="_blank" rel="noreferrer">
                  Join the YapHook server
                </a>
              </footer>
            </div>
          </section>

          <section className="pane preview-pane" aria-label="Preview">
            <div className="pv-channel">
              <span className="pv-hash">#</span>
              <span>preview</span>
              {firstInfo && <span className="muted">· sending as {firstInfo.name}</span>}
            </div>
            <Preview messages={messages} info={firstInfo} />
          </section>
        </main>
      )}

      {modal && <JsonModal spec={modal} onClose={() => setModal(null)} onCopied={() => push("ok", "Copied JSON")} />}
      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
