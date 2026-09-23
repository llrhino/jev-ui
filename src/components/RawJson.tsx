import type { CallResult } from '../api';
import { CopyButton } from './CopyButton';

interface Props {
  result: CallResult | null;
  loading: boolean;
}

export function RawJson({ result, loading }: Props) {
  if (loading) {
    return <div className="json-panel placeholder">実行中… Jev からの応答を待っています。</div>;
  }
  if (!result) {
    return (
      <div className="json-panel placeholder">
        「実行する」を押すと、ここに Jev からの生のレスポンス（JSON）が表示されます。
      </div>
    );
  }

  const pretty = result.data
    ? JSON.stringify(result.data, null, 2)
    : result.rawText || '(空のレスポンス)';

  return (
    <div className="json-panel">
      <div className="json-panel-head">
        <span className={`status-pill ${result.ok ? 'ok' : 'err'}`}>
          {result.status ? `HTTP ${result.status}` : '接続エラー'}
        </span>
        <CopyButton text={pretty} />
      </div>
      <pre className="json-block">
        <code>{pretty}</code>
      </pre>
    </div>
  );
}
