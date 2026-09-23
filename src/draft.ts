// エディタ用の下書き(Draft)を作る/変換するユーティリティ。
// 下書き ⇄ Jev の正規形(JSON) の相互変換と、送信前バリデーションを担う。

import type {
  ChoiceQuestion,
  JevRequest,
  Question,
  QuestionDraft,
  QuestionEntry,
  QuestionType,
  ScoreQuestion,
  StateDraft,
  StateValue,
} from './types';

/** React の key 等に使う、衝突しにくい安定IDを生成する */
export function makeKey(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const DEFAULT_MODEL = 'jev-latest';

// ---- 空の下書きを作る ----

export function createEmptyStateDraft(): StateDraft {
  return {
    mode: 'text',
    text: '',
    list: [{ key: makeKey(), value: '' }],
    pairs: [{ key: makeKey(), name: '', value: '' }],
  };
}

export function createEmptyQuestionDraft(type: QuestionType): QuestionDraft {
  switch (type) {
    case 'choice':
      return {
        type: 'choice',
        instructions: '',
        options: [
          { key: makeKey(), optKey: '', desc: '' },
          { key: makeKey(), optKey: '', desc: '' },
        ],
      };
    case 'score':
      return {
        type: 'score',
        instructions: '',
        levels: [
          { key: makeKey(), desc: '' },
          { key: makeKey(), desc: '' },
        ],
      };
    case 'noul':
      return { type: 'noul', instructions: '' };
  }
}

/** 一覧に追加する新しい質問エントリを作る（id は未使用のものを自動採番） */
export function createQuestionEntry(type: QuestionType, existingIds: string[]): QuestionEntry {
  const base = type === 'noul' ? 'question' : type;
  let id = base;
  let n = 1;
  const taken = new Set(existingIds);
  while (taken.has(id)) {
    n += 1;
    id = `${base}_${n}`;
  }
  return { key: makeKey(), id, draft: createEmptyQuestionDraft(type) };
}

// ---- 下書き → 正規形 ----

export function stateDraftToValue(draft: StateDraft): StateValue {
  if (draft.mode === 'text') {
    return draft.text;
  }
  if (draft.mode === 'list') {
    return draft.list.map((i) => i.value).filter((v) => v.trim() !== '');
  }
  // pairs
  const out: Record<string, string> = {};
  for (const p of draft.pairs) {
    if (p.name.trim() !== '') out[p.name] = p.value;
  }
  return out;
}

export function questionDraftToQuestion(draft: QuestionDraft): Question {
  if (draft.type === 'choice') {
    const criteria: Record<string, string> = {};
    for (const o of draft.options) {
      if (o.optKey.trim() !== '') criteria[o.optKey] = o.desc;
    }
    const q: ChoiceQuestion = { type: 'choice', instructions: draft.instructions, criteria };
    return q;
  }
  if (draft.type === 'score') {
    const q: ScoreQuestion = {
      type: 'score',
      instructions: draft.instructions,
      criteria: draft.levels.map((l) => l.desc),
    };
    return q;
  }
  return { type: 'noul', instructions: draft.instructions };
}

/** エディタの状態全体から、送信する JevRequest を組み立てる */
export function buildRequest(
  model: string,
  stateDraft: StateDraft,
  entries: QuestionEntry[],
): JevRequest {
  const questions: Record<string, Question> = {};
  for (const e of entries) {
    if (e.id.trim() === '') continue;
    // id 重複時は後勝ち（バリデーションで別途警告する）
    questions[e.id] = questionDraftToQuestion(e.draft);
  }
  return {
    model: model.trim() || DEFAULT_MODEL,
    state: stateDraftToValue(stateDraft),
    questions,
  };
}

// ---- バリデーション（非エンジニアにも分かる日本語で） ----

export function getValidationErrors(stateDraft: StateDraft, entries: QuestionEntry[]): string[] {
  const errors: string[] = [];

  const state = stateDraftToValue(stateDraft);
  const stateEmpty =
    (typeof state === 'string' && state.trim() === '') ||
    (Array.isArray(state) && state.length === 0) ||
    (!Array.isArray(state) && typeof state === 'object' && Object.keys(state).length === 0);
  if (stateEmpty) {
    errors.push('「判定したい内容」を入力してください。');
  }

  if (entries.length === 0) {
    errors.push('「聞きたいこと」を1つ以上追加してください。');
  }

  // id の空・重複チェック
  const idCounts = new Map<string, number>();
  for (const e of entries) {
    const id = e.id.trim();
    if (id === '') {
      errors.push('質問の「ID（キー）」が空の項目があります。');
    } else {
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
  }
  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`質問のID「${id}」が重複しています。IDはそれぞれ別の名前にしてください。`);
  }

  // 各質問の中身チェック
  for (const e of entries) {
    const label = e.id.trim() || '(ID未設定)';
    if (e.draft.instructions.trim() === '') {
      errors.push(`質問「${label}」の「聞きたいこと（指示文）」が空です。`);
    }
    if (e.draft.type === 'choice') {
      const keys = e.draft.options.map((o) => o.optKey.trim()).filter((k) => k !== '');
      if (keys.length < 2) {
        errors.push(`質問「${label}」は選択肢を2つ以上入力してください。`);
      }
      if (new Set(keys).size !== keys.length) {
        errors.push(`質問「${label}」の選択肢キーが重複しています。`);
      }
    }
    if (e.draft.type === 'score') {
      const filled = e.draft.levels.filter((l) => l.desc.trim() !== '');
      if (filled.length < 2) {
        errors.push(`質問「${label}」は評価の段階を2つ以上入力してください。`);
      }
    }
  }

  return errors;
}

// ---- 正規形 → 下書き（プリセット読み込み用） ----

export function stateValueToDraft(value: StateValue): StateDraft {
  const empty = createEmptyStateDraft();
  if (typeof value === 'string') {
    return { ...empty, mode: 'text', text: value };
  }
  if (Array.isArray(value)) {
    return {
      ...empty,
      mode: 'list',
      list: value.length
        ? value.map((v) => ({ key: makeKey(), value: v }))
        : empty.list,
    };
  }
  const pairs = Object.entries(value).map(([name, val]) => ({
    key: makeKey(),
    name,
    value: val,
  }));
  return {
    ...empty,
    mode: 'pairs',
    pairs: pairs.length ? pairs : empty.pairs,
  };
}

export function questionToDraft(q: Question): QuestionDraft {
  if (q.type === 'choice') {
    return {
      type: 'choice',
      instructions: q.instructions,
      options: Object.entries(q.criteria).map(([optKey, desc]) => ({
        key: makeKey(),
        optKey,
        desc,
      })),
    };
  }
  if (q.type === 'score') {
    return {
      type: 'score',
      instructions: q.instructions,
      levels: q.criteria.map((desc) => ({ key: makeKey(), desc })),
    };
  }
  return { type: 'noul', instructions: q.instructions };
}

export function questionsToEntries(questions: Record<string, Question>): QuestionEntry[] {
  return Object.entries(questions).map(([id, q]) => ({
    key: makeKey(),
    id,
    draft: questionToDraft(q),
  }));
}
