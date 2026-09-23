import { KeyStatusBanner } from './KeyStatusBanner';

export function Header({ keyConfigured }: { keyConfigured: boolean }) {
  return (
    <header className="app-header">
      <div className="container">
        <div className="brand">
          <span className="logo">
            JEV<span className="logo-accent">-UI</span>
          </span>
          <p className="tagline">
            Jev（TypeSafe AI の「判断モデル」）を、フォームと JSON で分かりやすく試すツール
          </p>
        </div>

        <details className="what-is">
          <summary>Jev って何？</summary>
          <div className="what-is-body">
            <p>
              Jev は、文章を書くふつうのAIとは違い、
              <strong>「渡した内容について、決めておいた質問に “型で” 答える」</strong>AIです。
              たとえば問い合わせ文を渡して「種類は？」「緊急？」と聞くと、
              選択肢の確率や「はい」の確率で返してくれます。
            </p>
            <ul>
              <li>
                <strong>選択肢から1つ選ぶ</strong>：各選択肢の確率（合計100%）が返る
              </li>
              <li>
                <strong>段階で評価する</strong>：低〜高の段階に沿った点数が返る
              </li>
              <li>
                <strong>はい / いいえ</strong>：「はい」である確率が返る
              </li>
            </ul>
          </div>
        </details>

        <KeyStatusBanner configured={keyConfigured} />
      </div>
    </header>
  );
}
