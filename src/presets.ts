// すぐ試せるサンプル（プリセット）。Jev は概念が新しいので、
// 例から入力形式を掴めるようにする。正規形で定義し、読み込み時に下書きへ変換する。

import type { Question, StateValue } from './types';

export interface Preset {
  id: string;
  name: string;
  description: string;
  model: string;
  state: StateValue;
  /** 挿入順を保つため配列で持つ（[id, question]） */
  questions: Array<[string, Question]>;
}

export const PRESETS: Preset[] = [
  {
    id: 'support-triage',
    name: 'サポート問い合わせの仕分け',
    description: 'お客様からの連絡を、種類・緊急度・満足度で自動的に仕分けする例。',
    model: 'jev-latest',
    state: '先日オンラインで注文した商品の代金が、クレジットカードに二重で請求されています。すぐに返金してください。何度も問い合わせているのに返事がなく、正直かなり怒っています。',
    questions: [
      [
        'topic',
        {
          type: 'choice',
          instructions: 'この問い合わせは主に何についてですか？',
          criteria: {
            billing: 'お金・請求・返金に関する問題',
            bug: '商品やサービスの不具合・故障',
            account: 'ログインやアカウント設定に関すること',
            other: '上のどれにも当てはまらない',
          },
        },
      ],
      [
        'urgent',
        {
          type: 'noul',
          instructions: 'この連絡は、今すぐ人間の担当者が対応すべき緊急のものですか？',
        },
      ],
      [
        'satisfaction',
        {
          type: 'score',
          instructions: 'お客様の現在の満足度はどれくらいですか？',
          criteria: [
            'とても不満・強い怒り',
            'やや不満',
            'どちらでもない',
            'やや満足',
            'とても満足',
          ],
        },
      ],
    ],
  },
  {
    id: 'article-moderation',
    name: '記事の分類とモデレーション',
    description: 'タイトルと本文を「項目と値」で渡し、カテゴリ分類と不適切表現の検出を行う例。',
    model: 'jev-latest',
    state: {
      title: '新しい格安SIMは本当にお得なのか徹底検証',
      body: '今回発表された格安SIMプランについて、料金・通信速度・サポート体制の3つの観点から実際に1か月使って検証しました。結論から言うと、ライトユーザーには十分おすすめできる内容です。',
    },
    questions: [
      [
        'category',
        {
          type: 'choice',
          instructions: 'この記事のジャンルはどれですか？',
          criteria: {
            tech: 'テクノロジー・ガジェット・IT',
            business: 'ビジネス・経済・お金',
            lifestyle: '暮らし・エンタメ・趣味',
            other: 'その他',
          },
        },
      ],
      [
        'toxicity',
        {
          type: 'noul',
          instructions: 'この記事に、攻撃的・差別的・不適切な表現が含まれていますか？',
        },
      ],
    ],
  },
  {
    id: 'review-scoring',
    name: 'レビューの質を採点',
    description: 'レビュー本文を渡し、内容の充実度を5段階で採点する例（score タイプ）。',
    model: 'jev-latest',
    state: '思っていたより小さかったけど、値段を考えれば十分だと思います。色もきれいで、届くのも早かったです。ただ、説明書がもう少し丁寧だと嬉しかったです。',
    questions: [
      [
        'quality',
        {
          type: 'score',
          instructions: 'このレビューは、他の購入検討者にとってどれくらい参考になりますか？',
          criteria: [
            '内容がなく参考にならない',
            'ほとんど参考にならない',
            '多少は参考になる',
            'かなり参考になる',
            '非常に参考になり具体的',
          ],
        },
      ],
    ],
  },
];
