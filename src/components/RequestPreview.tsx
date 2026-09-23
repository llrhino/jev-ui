import type { JevRequest } from '../types';
import { CopyButton } from './CopyButton';

export function RequestPreview({ request }: { request: JevRequest }) {
  const json = JSON.stringify(request, null, 2);
  return (
    <div className="json-panel">
      <div className="json-panel-head">
        <span className="json-hint">左のフォームを編集すると、ここがその場で変わります。</span>
        <CopyButton text={json} />
      </div>
      <pre className="json-block">
        <code>{json}</code>
      </pre>
    </div>
  );
}
