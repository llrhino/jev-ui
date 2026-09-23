import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'コピー' }: Props) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // クリップボードAPIが使えない環境向けのフォールバック
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  }

  return (
    <button type="button" className="copy-button" onClick={copy}>
      {done ? '✓ コピーしました' : label}
    </button>
  );
}
