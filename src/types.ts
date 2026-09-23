// ============================================================
// Jev(TypeSafe AI) API の「正規形」型
//   POST /v1/systemone に送る / から返る JSON の形。
// ============================================================

export type QuestionType = 'choice' | 'score' | 'noul';

/** state は 文字列 / 文字列の配列 / name-value オブジェクト のいずれか */
export type StateValue = string | string[] | Record<string, string>;

/** 選択肢から1つ選ぶ質問。criteria は「選択肢キー → 説明」 */
export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

/** 段階で評価する質問。criteria は 低→高 の順に並べた説明の配列 */
export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

/** はい/いいえ で答える質問。criteria は不要 */
export interface NoulQuestion {
  type: 'noul';
  instructions: string;
}

export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export interface JevRequest {
  model: string;
  state: StateValue;
  questions: Record<string, Question>;
}

// ---- レスポンス（フィールドは防御的に optional） ----

export interface ChoiceAnswer {
  type: 'choice';
  choice?: string;
  /** 選択肢キー → 確率（合計1）。実APIは probabilities で返す */
  probabilities?: Record<string, number>;
  /** 選択肢キー → 説明。Jev がレスポンスに同梱する */
  legend?: Record<string, string>;
  confidence?: number;
}

export interface ScoreAnswer {
  type: 'score';
  score?: number;
  /** レベル番号(文字列) → 確率（合計1）。実APIは probabilities で返す */
  probabilities?: Record<string, number>;
  /** レベル番号(文字列) → 説明。Jev がレスポンスに同梱する */
  legend?: Record<string, string>;
  confidence?: number;
  /** 旧想定（配列）への後方互換 */
  distribution?: number[];
}

export interface NoulAnswer {
  type: 'noul';
  noul?: number;
}

/** 既知の型に当てはまらない場合も生JSONで表示できるよう緩く受ける */
export type Answer =
  | ChoiceAnswer
  | ScoreAnswer
  | NoulAnswer
  | ({ type?: string } & Record<string, unknown>);

export interface JevUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export interface JevResponse {
  model?: string;
  answers?: Record<string, Answer>;
  usage?: JevUsage;
  // 一部の非公式資料が報告する { code, message, data } ラッパにも対応
  code?: number;
  message?: string;
  data?: { answers?: Record<string, Answer>; usage?: JevUsage };
}

// ============================================================
// エディタ（UI）用の「下書き」型
//   フォーム編集しやすいよう、順序と安定キーを保持する。
//   送信時に上の正規形へ変換する（draft.ts）。
// ============================================================

export type StateMode = 'text' | 'list' | 'pairs';

export interface ListItemDraft {
  key: string; // React用の安定キー
  value: string;
}

export interface PairDraft {
  key: string; // React用の安定キー
  name: string;
  value: string;
}

export interface StateDraft {
  mode: StateMode;
  text: string;
  list: ListItemDraft[];
  pairs: PairDraft[];
}

export interface ChoiceOptionDraft {
  key: string; // React用の安定キー
  optKey: string; // 選択肢のキー（JSONのキーになる）
  desc: string;
}

export interface ChoiceQuestionDraft {
  type: 'choice';
  instructions: string;
  options: ChoiceOptionDraft[];
}

export interface ScoreLevelDraft {
  key: string; // React用の安定キー
  desc: string;
}

export interface ScoreQuestionDraft {
  type: 'score';
  instructions: string;
  levels: ScoreLevelDraft[];
}

export interface NoulQuestionDraft {
  type: 'noul';
  instructions: string;
}

export type QuestionDraft =
  | ChoiceQuestionDraft
  | ScoreQuestionDraft
  | NoulQuestionDraft;

export interface QuestionEntry {
  key: string; // React用の安定キー
  id: string; // 送信時のオブジェクトキー
  draft: QuestionDraft;
}
