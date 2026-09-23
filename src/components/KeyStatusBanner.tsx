export function KeyStatusBanner({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <div className="banner banner-ok">
        <span className="banner-icon">✓</span>
        <span>APIキーが設定されています。そのまま「実行する」で試せます。</span>
      </div>
    );
  }
  return (
    <div className="banner banner-warn">
      <span className="banner-icon">!</span>
      <span>
        <strong>APIキーが未設定です。</strong> プロジェクト直下に <code>.env</code> を作り、
        <code>TYPESAFE_API_KEY=あなたのキー</code> を設定して開発サーバを再起動してください
        （<code>cp .env.example .env</code>）。設定するまで実行はエラーになります。
      </span>
    </div>
  );
}
