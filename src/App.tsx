import { useCallback, useEffect, useMemo, useState } from "react";
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
import { KEYS, load, save } from "./storage";
import { welcome } from "./welcome";
import { MessageEditor, move } from "./components/Editor";
import { Help } from "./components/Help";
import { JsonModal, JsonModalSpec } from "./components/JsonModal";
import { Preview } from "./components/Preview";
import { InfoState, Targets } from "./components/Targets";
import { Toasts, useToasts } from "./components/Toasts";
import { Icon } from "./components/ui";

type View = "builder" | "help";

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

const viewFromHash = (): View => (location.hash === "#help" ? "help" : "builder");

export default function App() {
  const [messages, setMessages] = useState<MessageS[]>(initialMessages);
  const [targets, setTargets] = useState<TargetS[]>(initialTargets);
  const [infos, setInfos] = useState<Record<string, InfoState>>({});
  const [view, setView] = useState<View>(viewFromHash);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [modal, setModal] = useState<JsonModalSpec | null>(null);
  const [sending, setSending] = useState(false);
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

  const goTo = (v: View) => {
    history.pushState(null, "", v === "help" ? "#help" : location.pathname);
    setView(v);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const t = setTimeout(() => save(KEYS.messages, toBackup(messages)), 250);
    return () => clearTimeout(t);
  }, [messages]);
  useEffect(() => save(KEYS.targets, targets.map((t) => t.url).filter(Boolean)), [targets]);

  const onInfo = useCallback((id: string, s: InfoState) => setInfos((m) => ({ ...m, [id]: s })), []);

  const errors = useMemo(
    () =>
      messages.flatMap((m, i) => validateMessage(m).map((e) => (messages.length > 1 ? `Message ${i + 1}: ${e}` : e))),
    [messages],
  );
  const ready = targets.filter((t) => infos[t.id]?.status === "ok" && webhookApiUrl(t.url));
  const firstInfo = ready.length ? infos[ready[0].id].info : undefined;

  const send = async () => {
    if (!ready.length) return push("err", "Add a valid Yapin webhook URL first");
    if (errors.length) return push("err", `Fix before sending: ${errors[0]}`);
    setSending(true);
    let ok = 0;
    let fail = 0;
    for (const t of ready) {
      for (const [i, m] of messages.entries()) {
        try {
          await postMessage(webhookApiUrl(t.url)!, toPayload(m));
          ok++;
        } catch (e) {
          fail++;
          push("err", `Message ${i + 1} → ${infos[t.id]?.info?.name ?? "webhook"}: ${(e as Error).message}`);
        }
      }
    }
    setSending(false);
    if (ok) push("ok", `Sent ${ok} message${ok === 1 ? "" : "s"}${fail ? ` · ${fail} failed` : ""}`);
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
    if (confirm("Clear all messages and start fresh?")) setMessages([newMessage()]);
  };

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
          <button type="button" className={view === "help" ? "on" : ""} onClick={() => goTo("help")}>
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
                title={errors[0] ?? (ready.length ? "Send to webhook" : "Add a webhook URL first")}
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
          <Help onOpenBuilder={() => goTo("builder")} />
        </main>
      ) : (
        <main className={`layout show-${tab}`}>
          <section className="pane editor-pane" aria-label="Editor">
            <div className="pane-inner">
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
                  </div>
                  <ul>
                    {errors.slice(0, 8).map((e, i) => (
                      <li key={i}>{e}</li>
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
