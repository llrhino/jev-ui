// 専門用語を非エンジニア向けの日本語に対応づける表。

import type { QuestionType } from './types';

export interface TypeLabel {
  /** 平易な呼び方 */
  label: string;
  /** 正式名（Jev API 上のタイプ名） */
  apiName: QuestionType;
  icon: string;
  /** どんな質問かの短い説明 */
  desc: string;
}

export const TYPE_LABELS: Record<QuestionType, TypeLabel> = {
  choice: {
    label: '選択肢から1つ選ぶ',
    apiName: 'choice',
    icon: '🔀',
    desc: '用意した選択肢の中から、最もあてはまるものを1つ選びます。各選択肢の確率（合計100%）と確信度が返ります。',
  },
  score: {
    label: '段階で評価する（点数）',
    apiName: 'score',
    icon: '📊',
    desc: '「低い→高い」の順に段階を並べて定義します。その範囲での点数（加重平均）・分布・確信度が返ります。',
  },
  noul: {
    label: 'はい / いいえ で答える',
    apiName: 'noul',
    icon: '❓',
    desc: '「はい/いいえ」で答えられる質問に、「はい」である確率（0〜100%）で答えます。※このタイプに確信度はありません。',
  },
};

export const QUESTION_TYPES: QuestionType[] = ['choice', 'score', 'noul'];

export const STATE_MODE_LABELS = {
  text: { label: '文章', desc: '1つのまとまった文章（お客様の連絡、レビュー本文など）' },
  list: { label: '文章のリスト', desc: '複数の短い文章を並べる（箇条書きのようなもの）' },
  pairs: { label: '項目と値', desc: '「タイトル: ○○」「本文: △△」のように名前つきで渡す' },
} as const;
