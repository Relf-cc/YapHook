import {
  EmbedS,
  FieldS,
  LIMITS,
  MessageS,
  cloneEmbed,
  embedLength,
  newEmbed,
  newField,
} from "../model";
import { Card, ColorPicker, HelpLink, Icon, IconButton, TextField, Toggle, isoToLocalInput } from "./ui";

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const out = arr.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));
const insertAfter = <T,>(arr: T[], i: number, v: T) => [...arr.slice(0, i + 1), v, ...arr.slice(i + 1)];
const removeAt = <T,>(arr: T[], i: number) => arr.filter((_, j) => j !== i);

interface ListControls {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function Controls({ index, total, onMove, onDuplicate, onRemove, dupDisabled }: ListControls & { dupDisabled?: boolean }) {
  return (
    <>
      <IconButton icon="up" title="Move up" onClick={() => onMove(-1)} disabled={index === 0} />
      <IconButton icon="down" title="Move down" onClick={() => onMove(1)} disabled={index === total - 1} />
      <IconButton icon="copy" title="Duplicate" onClick={onDuplicate} disabled={dupDisabled} />
      <IconButton icon="trash" title="Remove" onClick={onRemove} danger />
    </>
  );
}

// ---------- message ----------

export function MessageEditor({
  message: m,
  onChange,
  onJson,
  ...ctl
}: ListControls & {
  message: MessageS;
  onChange: (m: MessageS) => void;
  onJson: () => void;
}) {
  const set = (p: Partial<MessageS>) => onChange({ ...m, ...p });
  const setEmbeds = (embeds: EmbedS[]) => set({ embeds });
  const preview = m.content.trim().split("\n")[0]?.slice(0, 40) || (m.embeds[0]?.title ?? "");

  return (
    <Card
      title={`Message ${ctl.index + 1}`}
      help="building"
      badge={preview || undefined}
      actions={
        <>
          <IconButton icon="code" title="Edit JSON" onClick={onJson} />
          <Controls {...ctl} />
        </>
      }
    >
      <TextField
        label="Content"
        multiline
        rows={4}
        value={m.content}
        max={LIMITS.content}
        placeholder="Say something… **markdown** works, as do <t:1700000000:R> timestamps."
        onChange={(content) => set({ content })}
        hint={
          <>
            Markdown, mentions and timestamps all work here.{" "}
            <HelpLink to="formatting" text="Formatting reference" label="Formatting reference" />
          </>
        }
      />

      <Card title="Profile" help="profile" level={1} defaultOpen={!!(m.username || m.avatarUrl)}>
        <div className="grid2">
          <TextField
            label="Username"
            value={m.username}
            max={LIMITS.username}
            placeholder="Defaults to webhook name"
            onChange={(username) => set({ username })}
          />
          <TextField
            label="Avatar URL"
            type="url"
            value={m.avatarUrl}
            placeholder="https://…/avatar.png"
            onChange={(avatarUrl) => set({ avatarUrl })}
            hint={
              <>
                Direct link to an image file.{" "}
                <HelpLink to="faq-image" text="Not showing?" label="Why an image might not show" />
              </>
            }
          />
        </div>
      </Card>

      {m.embeds.map((e, i) => (
        <EmbedEditor
          key={e.id}
          embed={e}
          index={i}
          total={m.embeds.length}
          onChange={(ne) => setEmbeds(setAt(m.embeds, i, ne))}
          onMove={(d) => setEmbeds(move(m.embeds, i, d))}
          onDuplicate={() => setEmbeds(insertAfter(m.embeds, i, cloneEmbed(e)))}
          onRemove={() => setEmbeds(removeAt(m.embeds, i))}
          dupDisabled={m.embeds.length >= LIMITS.embeds}
        />
      ))}

      <div className="row-actions">
        <button
          type="button"
          className="btn ghost"
          disabled={m.embeds.length >= LIMITS.embeds}
          onClick={() => setEmbeds([...m.embeds, newEmbed()])}
        >
          <Icon name="plus" /> Add embed
          <span className="muted">
            {m.embeds.length}/{LIMITS.embeds}
          </span>
        </button>
      </div>
    </Card>
  );
}

// ---------- embed ----------

function EmbedEditor({
  embed: e,
  onChange,
  dupDisabled,
  ...ctl
}: ListControls & { embed: EmbedS; onChange: (e: EmbedS) => void; dupDisabled: boolean }) {
  const set = (p: Partial<EmbedS>) => onChange({ ...e, ...p });
  const setFields = (fields: FieldS[]) => set({ fields });
  const len = embedLength(e);

  return (
    <Card
      level={1}
      accent={e.color || "#4b4d57"}
      title={`Embed ${ctl.index + 1}`}
      help="embeds"
      badge={e.title || e.authorName || undefined}
      actions={<Controls {...ctl} dupDisabled={dupDisabled} />}
    >
      <Card title="Author" help="embeds" level={2} defaultOpen={!!e.authorName}>
        <TextField label="Name" value={e.authorName} max={LIMITS.author} onChange={(authorName) => set({ authorName })} />
        <div className="grid2">
          <TextField label="URL" type="url" value={e.authorUrl} placeholder="https://" onChange={(authorUrl) => set({ authorUrl })} />
          <TextField label="Icon URL" type="url" value={e.authorIcon} placeholder="https://" onChange={(authorIcon) => set({ authorIcon })} />
        </div>
      </Card>

      <Card title="Body" help="formatting" level={2}>
        <TextField label="Title" value={e.title} max={LIMITS.title} onChange={(title) => set({ title })} />
        <TextField label="Title URL" type="url" value={e.url} placeholder="https://" onChange={(url) => set({ url })} />
        <TextField
          label="Description"
          multiline
          rows={4}
          value={e.description}
          max={LIMITS.description}
          onChange={(description) => set({ description })}
        />
        <ColorPicker value={e.color} onChange={(color) => set({ color })} />
      </Card>

      <Card
        title="Fields"
        help="fields"
        level={2}
        badge={e.fields.length ? `${e.fields.length}/${LIMITS.fields}` : undefined}
        defaultOpen={e.fields.length > 0}
      >
        {e.fields.map((f, i) => (
          <FieldEditor
            key={f.id}
            field={f}
            index={i}
            total={e.fields.length}
            onChange={(nf) => setFields(setAt(e.fields, i, nf))}
            onMove={(d) => setFields(move(e.fields, i, d))}
            onDuplicate={() => setFields(insertAfter(e.fields, i, { ...f, id: newField().id }))}
            onRemove={() => setFields(removeAt(e.fields, i))}
            dupDisabled={e.fields.length >= LIMITS.fields}
          />
        ))}
        <div className="row-actions">
          <button
            type="button"
            className="btn ghost"
            disabled={e.fields.length >= LIMITS.fields}
            onClick={() => setFields([...e.fields, newField()])}
          >
            <Icon name="plus" /> Add field
          </button>
        </div>
      </Card>

      <Card title="Images" help="images" level={2} defaultOpen={!!(e.image || e.thumbnail)}>
        <TextField
          label="Image URL"
          type="url"
          value={e.image}
          placeholder="https://…/banner.png"
          onChange={(image) => set({ image })}
          hint={
            <>
              Wide picture under the embed. Needs a direct link to the file.{" "}
              <HelpLink to="faq-image" text="Not showing?" label="Why an image might not show" />
            </>
          }
        />
        <TextField
          label="Thumbnail URL"
          type="url"
          value={e.thumbnail}
          placeholder="https://…/thumb.png"
          onChange={(thumbnail) => set({ thumbnail })}
          hint="Small picture in the top-right corner."
        />
      </Card>

      <Card title="Footer" help="footer" level={2} defaultOpen={!!(e.footerText || e.timestamp)}>
        <TextField label="Text" value={e.footerText} max={LIMITS.footer} onChange={(footerText) => set({ footerText })} />
        <TextField label="Icon URL" type="url" value={e.footerIcon} placeholder="https://" onChange={(footerIcon) => set({ footerIcon })} />
        <div className="fld">
          <span className="fld-label">
            <span>Timestamp</span>
            <HelpLink to="footer" text="Shown in each reader's time zone" label="About timestamps" />
          </span>
          <div className="ts-row">
            <input
              className="input"
              type="datetime-local"
              value={isoToLocalInput(e.timestamp)}
              onChange={(ev) => {
                const d = new Date(ev.target.value);
                set({ timestamp: ev.target.value && !isNaN(d.getTime()) ? d.toISOString() : "" });
              }}
            />
            <button type="button" className="btn ghost sm" onClick={() => set({ timestamp: new Date().toISOString() })}>
              <Icon name="clock" /> Now
            </button>
            {e.timestamp && <IconButton icon="x" title="Clear timestamp" onClick={() => set({ timestamp: "" })} />}
          </div>
        </div>
      </Card>

      <div className={`embed-total${len > LIMITS.embedTotal ? " over" : ""}`}>
        {len.toLocaleString()} / {LIMITS.embedTotal.toLocaleString()} characters
      </div>
    </Card>
  );
}

// ---------- field ----------

function FieldEditor({
  field: f,
  onChange,
  dupDisabled,
  ...ctl
}: ListControls & { field: FieldS; onChange: (f: FieldS) => void; dupDisabled: boolean }) {
  const set = (p: Partial<FieldS>) => onChange({ ...f, ...p });
  return (
    <div className="field-ed">
      <div className="field-ed-head">
        <span className="field-ed-num">{ctl.index + 1}</span>
        <Toggle label="Inline" checked={f.inline} onChange={(inline) => set({ inline })} />
        <div className="card-actions">
          <Controls {...ctl} dupDisabled={dupDisabled} />
        </div>
      </div>
      <TextField label="Name" value={f.name} max={LIMITS.fieldName} onChange={(name) => set({ name })} />
      <TextField label="Value" multiline rows={2} value={f.value} max={LIMITS.fieldValue} onChange={(value) => set({ value })} />
    </div>
  );
}
