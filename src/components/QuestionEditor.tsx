import { createEmptyQuestionDraft, makeKey } from '../draft';
import { QUESTION_TYPES, TYPE_LABELS } from '../labels';
import type { QuestionDraft, QuestionEntry, QuestionType } from '../types';

interface Props {
  entry: QuestionEntry;
  index: number;
  total: number;
  onChangeId: (key: string, id: string) => void;
  onChangeDraft: (key: string, draft: QuestionDraft) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, dir: -1 | 1) => void;
}

export function QuestionEditor({
  entry,
  index,
  total,
  onChangeId,
  onChangeDraft,
  onRemove,
  onMove,
}: Props) {
  const { key, id, draft } = entry;

  function switchType(type: QuestionType) {
    if (type === draft.type) return;
    const fresh = createEmptyQuestionDraft(type);
    fresh.instructions = draft.instructions;
    onChangeDraft(key, fresh);
  }

  return (
    <div className="question-card">
      <div className="question-card-head">
        <span className="question-num">質問 {index + 1}</span>
        <div className="question-card-actions">
          <button
            type="button"
            className="icon-button"
            title="上へ"
            aria-label="上へ移動"
            onClick={() => onMove(key, -1)}
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-button"
            title="下へ"
            aria-label="下へ移動"
            onClick={() => onMove(key, 1)}
            disabled={index === total - 1}
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-button danger"
            title="この質問を削除"
            aria-label="この質問を削除"
            onClick={() => onRemove(key)}
          >
            ×
          </button>
        </div>
      </div>

      {/* 答え方（タイプ）の選択 */}
      <div className="field">
        <label className="field-label">答え方</label>
        <div className="type-cards">
          {QUESTION_TYPES.map((t) => {
            const meta = TYPE_LABELS[t];
            return (
              <button
                key={t}
                type="button"
                className={`type-card${draft.type === t ? ' is-active' : ''}`}
                onClick={() => switchType(t)}
                title={meta.desc}
              >
                <span className="type-icon">{meta.icon}</span>
                <span className="type-label">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <p className="field-hint subtle">{TYPE_LABELS[draft.type].desc}</p>
      </div>

      {/* ID（結果のキー） */}
      <div className="field">
        <label className="field-label" htmlFor={`id-${key}`}>
          この質問のID（キー）
        </label>
        <input
          id={`id-${key}`}
          className="text-input mono"
          type="text"
          value={id}
          placeholder="topic"
          onChange={(e) => onChangeId(key, e.target.value)}
        />
        <p className="field-hint">結果はこのIDごとに返ります。半角英数字がおすすめです（例: topic, urgent）。</p>
      </div>

      {/* 指示文 */}
      <div className="field">
        <label className="field-label" htmlFor={`inst-${key}`}>
          聞きたいこと（指示文）
        </label>
        <textarea
          id={`inst-${key}`}
          className="textarea"
          rows={2}
          value={draft.instructions}
          placeholder="例: この問い合わせは何についてですか？"
          onChange={(e) => onChangeDraft(key, { ...draft, instructions: e.target.value })}
        />
      </div>

      {/* タイプ別の詳細 */}
      {draft.type === 'choice' && (
        <div className="field">
          <label className="field-label">選択肢（2つ以上）</label>
          <p className="field-hint">
            「キー」は結果に返る値です。「説明」はJevが判断する手がかりになります。
          </p>
          <div className="rows">
            {draft.options.map((o) => (
              <div className="row" key={o.key}>
                <input
                  className="text-input mono opt-key"
                  type="text"
                  value={o.optKey}
                  placeholder="billing"
                  onChange={(e) =>
                    onChangeDraft(key, {
                      ...draft,
                      options: draft.options.map((x) =>
                        x.key === o.key ? { ...x, optKey: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  className="text-input"
                  type="text"
                  value={o.desc}
                  placeholder="説明（任意・例: お金や請求の問題）"
                  onChange={(e) =>
                    onChangeDraft(key, {
                      ...draft,
                      options: draft.options.map((x) =>
                        x.key === o.key ? { ...x, desc: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="この選択肢を削除"
                  title="この選択肢を削除"
                  onClick={() =>
                    onChangeDraft(key, {
                      ...draft,
                      options: draft.options.filter((x) => x.key !== o.key),
                    })
                  }
                  disabled={draft.options.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-button small"
            onClick={() =>
              onChangeDraft(key, {
                ...draft,
                options: [...draft.options, { key: makeKey(), optKey: '', desc: '' }],
              })
            }
          >
            ＋ 選択肢を追加
          </button>
        </div>
      )}

      {draft.type === 'score' && (
        <div className="field">
          <label className="field-label">評価の段階（低い→高い の順に2つ以上）</label>
          <p className="field-hint">
            上が低い点(0)、下にいくほど高い点です。返る点数はこの段階に沿った加重平均になります。
          </p>
          <div className="rows">
            {draft.levels.map((l, i) => (
              <div className="row" key={l.key}>
                <span className="level-badge">レベル {i}</span>
                <input
                  className="text-input"
                  type="text"
                  value={l.desc}
                  placeholder={i === 0 ? '例: とても低い' : '例: とても高い'}
                  onChange={(e) =>
                    onChangeDraft(key, {
                      ...draft,
                      levels: draft.levels.map((x) =>
                        x.key === l.key ? { ...x, desc: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label="この段階を削除"
                  title="この段階を削除"
                  onClick={() =>
                    onChangeDraft(key, {
                      ...draft,
                      levels: draft.levels.filter((x) => x.key !== l.key),
                    })
                  }
                  disabled={draft.levels.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-button small"
            onClick={() =>
              onChangeDraft(key, {
                ...draft,
                levels: [...draft.levels, { key: makeKey(), desc: '' }],
              })
            }
          >
            ＋ 段階を追加
          </button>
        </div>
      )}

      {draft.type === 'noul' && (
        <p className="field-hint subtle noul-note">
          このタイプは追加の設定は不要です。「はい」である確率（0〜100%）が返ります。
        </p>
      )}
    </div>
  );
}
