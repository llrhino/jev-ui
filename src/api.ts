// Jev API 呼び出し。ブラウザは同一オリジンの /api/jev を叩き、
// Vite dev サーバがそれを本番APIへ中継し Authorization を付与する（vite.config.ts）。

import type { Answer, JevRequest, JevResponse, JevUsage } from './types';

export interface CallResult {
  ok: boolean;
  /** HTTP ステータス。ネットワークエラー時は 0 */
  status: number;
  data: JevResponse | null;
  /** 返ってきた生のボディ（表示用） */
  rawText: string;
  /** 問題があったときの、人が読める日本語メッセージ */
  errorMessage: string | null;
}

const ENDPOINT = '/api/jev';

export async function callJev(request: JevRequest): Promise<CallResult> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      status: 0,
      data: null,
      rawText: '',
      errorMessage: `サーバに接続できませんでした。開発サーバ(npm run dev)が起動しているか確認してください。（${detail}）`,
    };
  }

  const rawText = await res.text();
  let data: JevResponse | null = null;
  try {
    data = rawText ? (JSON.parse(rawText) as JevResponse) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    let msg = `エラーが発生しました（HTTP ${res.status}）。`;
    if (res.status === 401 || res.status === 403) {
      msg = `APIキーが未設定か、正しくないようです（HTTP ${res.status}）。プロジェクト直下の .env に TYPESAFE_API_KEY を設定し、開発サーバを再起動してください。`;
    } else if (res.status === 429) {
      msg = 'リクエストが多すぎます（HTTP 429）。少し時間をおいて再度お試しください。';
    } else if (res.status >= 500) {
      msg = `Jev 側で一時的なエラーが発生しました（HTTP ${res.status}）。時間をおいて再度お試しください。`;
    }
    if (data?.message) msg += `\nAPIからのメッセージ: ${data.message}`;
    return { ok: false, status: res.status, data, rawText, errorMessage: msg };
  }

  return { ok: true, status: res.status, data, rawText, errorMessage: null };
}

/** レスポンスのラッパ差異を吸収して answers を取り出す */
export function extractAnswers(data: JevResponse | null): Record<string, Answer> | null {
  if (!data) return null;
  if (data.answers && typeof data.answers === 'object') return data.answers;
  if (data.data?.answers && typeof data.data.answers === 'object') return data.data.answers;
  return null;
}

export function extractUsage(data: JevResponse | null): JevUsage | null {
  if (!data) return null;
  return data.usage ?? data.data?.usage ?? null;
}

export type AnswerKind = 'choice' | 'score' | 'noul' | 'unknown';

/** answer の型を判定（type が無い場合は中身から推定） */
export function inferAnswerKind(answer: Answer): AnswerKind {
  const a = answer as Record<string, unknown>;
  const t = a.type;
  if (t === 'choice' || t === 'score' || t === 'noul') return t;
  if (typeof a.noul === 'number') return 'noul';
  // score も probabilities を持つため、choice より先に判定する
  if (typeof a.score === 'number' || Array.isArray(a.distribution)) return 'score';
  if (a.probabilities && typeof a.probabilities === 'object') return 'choice';
  return 'unknown';
}
