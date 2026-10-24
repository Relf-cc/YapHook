import { useEffect, useState } from "react";
import { TargetS, WebhookInfo, fetchWebhook, uid, webhookApiUrl } from "../model";
import { Card, Icon, IconButton } from "./ui";

export type InfoState = { status: "idle" | "loading" | "ok" | "error"; info?: WebhookInfo; error?: string };

function TargetRow({
  target,
  onChange,
  onRemove,
  onInfo,
  canRemove,
}: {
  target: TargetS;
  onChange: (url: string) => void;
  onRemove: () => void;
  onInfo: (s: InfoState) => void;
  canRemove: boolean;
}) {
  const [state, setState] = useState<InfoState>({ status: "idle" });
  const [reveal, setReveal] = useState(false);
  const api = webhookApiUrl(target.url);

  const update = (s: InfoState) => {
    setState(s);
    onInfo(s);
  };

  useEffect(() => {
    if (!target.url.trim()) return update({ status: "idle" });
    if (!api) return update({ status: "error", error: "Not a Yapin webhook URL" });
    const ctrl = new AbortController();
    update({ status: "loading" });
    const t = setTimeout(() => {
      fetchWebhook(api, ctrl.signal)
        .then((info) => update({ status: "ok", info }))
        .catch((e) => !ctrl.signal.aborted && update({ status: "error", error: e.message }));
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [api, target.url]);

  return (
    <div className={`target ${state.status}`}>
      <div className="target-input">
        <input
          className={`input mono${state.status === "error" ? " bad" : ""}${reveal ? "" : " masked"}`}
          value={target.url}
          placeholder="https://www.yapin.gg/api/webhooks/…/…"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setReveal(true)}
          onBlur={() => setReveal(false)}
        />
        {canRemove && <IconButton icon="x" title="Remove webhook" onClick={onRemove} />}
      </div>
      <div className="target-status">
        {state.status === "loading" && <span className="muted">Checking…</span>}
        {state.status === "error" && (
          <span className="err">
            <Icon name="alert" size={14} /> {state.error}
          </span>
        )}
        {state.status === "ok" && state.info && (
          <span className="ok">
            {state.info.avatar_url ? (
              <img src={state.info.avatar_url} alt="" className="target-avatar" />
            ) : (
              <Icon name="check" size={14} />
            )}
            <strong>{state.info.name}</strong>
            <span className="muted">ready to send</span>
          </span>
        )}
        {state.status === "idle" && (
          <span className="muted">
            Paste a webhook URL from your Yapin&apos; server settings. It&apos;s stored only in this browser.
          </span>
        )}
      </div>
    </div>
  );
}

export function Targets({
  targets,
  setTargets,
  onInfo,
}: {
  targets: TargetS[];
  setTargets: (t: TargetS[]) => void;
  onInfo: (id: string, s: InfoState) => void;
}) {
  return (
    <Card title="Webhooks" badge={targets.length > 1 ? `${targets.length} targets` : undefined}>
      {targets.map((t, i) => (
        <TargetRow
          key={t.id}
          target={t}
          canRemove={targets.length > 1}
          onChange={(url) => setTargets(targets.map((x, j) => (j === i ? { ...x, url } : x)))}
          onRemove={() => setTargets(targets.filter((_, j) => j !== i))}
          onInfo={(s) => onInfo(t.id, s)}
        />
      ))}
      <div className="row-actions">
        <button type="button" className="btn ghost" onClick={() => setTargets([...targets, { id: uid(), url: "" }])}>
          <Icon name="plus" /> Add webhook
        </button>
      </div>
    </Card>
  );
}
