import { makeKey } from '../draft';
import { STATE_MODE_LABELS } from '../labels';
import type { StateDraft, StateMode } from '../types';

interface Props {
  draft: StateDraft;
  onChange: (d: StateDraft) => void;
}

const MODES: StateMode[] = ['text', 'list', 'pairs'];

export function StateEditor({ draft, onChange }: Props) {
  const setMode = (mode: StateMode) => onChange({ ...draft, mode });

  return (
    <div className="field">
      <label className="field-label">判定したい内容（state）</label>
      <p className="field-hint">Jev に見てもらう対象です。まずは「文章」でOKです。</p>

      <div className="segmented" role="tablist" aria-label="入力の形式">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={draft.mode === m}
            className={`segment${draft.mode === m ? ' is-active' : ''}`}
            onClick={() => setMode(m)}
            title={STATE_MODE_LABELS[m].desc}
          >
            {STATE_MODE_LABELS[m].label}
          </button>
        ))}
      </div>
      <p className="field-hint subtle">{STATE_MODE_LABELS[draft.mode].desc}</p>

      {draft.mode === 'text' && (
        <textarea
          className="textarea"
          rows={5}
          value={draft.text}
          placeholder="例: 二重請求されて怒っている、というお客様からの連絡文"
          onChange={(e) => onChange({ ...draft, text: e.target.value })}
        />
      )}

      {draft.mode === 'list' && (
        <div className="rows">
          {draft.list.map((item) => (
            <div className="row" key={item.key}>
              <input
                className="text-input"
                type="text"
                value={item.value}
                placeholder="短い文章を1つ"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    list: draft.list.map((i) =>
                      i.key === item.key ? { ...i, value: e.target.value } : i,
                    ),
                  })
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label="この行を削除"
                title="この行を削除"
                onClick={() =>
                  onChange({ ...draft, list: draft.list.filter((i) => i.key !== item.key) })
                }
                disabled={draft.list.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-button small"
            onClick={() => onChange({ ...draft, list: [...draft.list, { key: makeKey(), value: '' }] })}
          >
            ＋ 行を追加
          </button>
        </div>
      )}

      {draft.mode === 'pairs' && (
        <div className="rows">
          {draft.pairs.map((p) => (
            <div className="row" key={p.key}>
              <input
                className="text-input pair-name"
                type="text"
                value={p.name}
                placeholder="項目名（例: title）"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    pairs: draft.pairs.map((x) =>
                      x.key === p.key ? { ...x, name: e.target.value } : x,
                    ),
                  })
                }
              />
              <input
                className="text-input"
                type="text"
                value={p.value}
                placeholder="値（例: 記事のタイトル）"
                onChange={(e) =>
                  onChange({
                    ...draft,
                    pairs: draft.pairs.map((x) =>
                      x.key === p.key ? { ...x, value: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                type="button"
                className="icon-button"
                aria-label="この行を削除"
                title="この行を削除"
                onClick={() =>
                  onChange({ ...draft, pairs: draft.pairs.filter((x) => x.key !== p.key) })
                }
                disabled={draft.pairs.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-button small"
            onClick={() =>
              onChange({ ...draft, pairs: [...draft.pairs, { key: makeKey(), name: '', value: '' }] })
            }
          >
            ＋ 項目を追加
          </button>
        </div>
      )}
    </div>
  );
}
