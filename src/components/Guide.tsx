import { HelpLink, Icon } from "./ui";

export interface GuideStep {
  label: string;
  /** What to do, shown while this step is the current one. */
  hint: string;
  done: boolean;
  /** Help section to link from the hint. */
  help?: string;
}

/**
 * Three-step checklist above the editor that ticks itself off. It is the first
 * thing a newcomer sees, and the thing they can dismiss once they've sent one
 * message.
 */
export function Guide({ steps, onDismiss }: { steps: GuideStep[]; onDismiss: () => void }) {
  const doneCount = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  const allDone = current < 0;

  return (
    <section className={`guide${allDone ? " done" : ""}`} aria-label="Getting started">
      <header className="guide-head">
        <Icon name={allDone ? "check" : "bulb"} size={15} />
        <strong>{allDone ? "That's everything — nice one" : "New here? Three steps"}</strong>
        <span className="guide-count">
          {doneCount}/{steps.length}
        </span>
        <span className="spacer" />
        <a className="help-link" href="#help">
          Full guide
        </a>
        <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Hide getting started">
          <Icon name="x" />
        </button>
      </header>
      <ol className="guide-steps">
        {steps.map((s, i) => (
          <li key={s.label} className={s.done ? "done" : i === current ? "now" : ""}>
            <span className="guide-mark">{s.done ? <Icon name="check" size={13} /> : i + 1}</span>
            <span className="guide-text">
              <span className="guide-label">{s.label}</span>
              {i === current && (
                <span className="guide-hint">
                  {s.hint} {s.help && <HelpLink to={s.help} text="Help" label="Open help" />}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
      {allDone && (
        <p className="guide-outro">
          Keep a <strong>JSON</strong> backup of anything you'd hate to retype, and remember sent messages can't be
          edited. <a href="#help/shortcuts">Shortcuts &amp; tips</a>
        </p>
      )}
    </section>
  );
}
