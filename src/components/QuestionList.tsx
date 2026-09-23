import { QUESTION_TYPES, TYPE_LABELS } from '../labels';
import type { QuestionDraft, QuestionEntry, QuestionType } from '../types';
import { QuestionEditor } from './QuestionEditor';

interface Props {
  entries: QuestionEntry[];
  onAdd: (type: QuestionType) => void;
  onChangeId: (key: string, id: string) => void;
  onChangeDraft: (key: string, draft: QuestionDraft) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, dir: -1 | 1) => void;
}

export function QuestionList({
  entries,
  onAdd,
  onChangeId,
  onChangeDraft,
  onRemove,
  onMove,
}: Props) {
  return (
    <div className="field">
      <label className="field-label">聞きたいこと（questions）</label>
      <p className="field-hint">
        1つの内容に対して、いくつでも質問できます。それぞれ独立して並行に判定されます。
      </p>

      {entries.length === 0 && (
        <div className="empty-hint">
          まだ質問がありません。下のボタンから追加するか、上の「例から試す」を押してください。
        </div>
      )}

      <div className="question-list">
        {entries.map((entry, i) => (
          <QuestionEditor
            key={entry.key}
            entry={entry}
            index={i}
            total={entries.length}
            onChangeId={onChangeId}
            onChangeDraft={onChangeDraft}
            onRemove={onRemove}
            onMove={onMove}
          />
        ))}
      </div>

      <div className="add-question">
        <span className="add-question-label">質問を追加：</span>
        <div className="add-question-buttons">
          {QUESTION_TYPES.map((t) => (
            <button key={t} type="button" className="add-button" onClick={() => onAdd(t)}>
              <span className="type-icon">{TYPE_LABELS[t].icon}</span>
              {TYPE_LABELS[t].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
