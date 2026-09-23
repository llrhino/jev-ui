import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';

// Jev(TypeSafe AI) の本番エンドポイント
const JEV_API_ORIGIN = 'https://api.typesafe.ai';
const JEV_API_PATH = '/v1/systemone';

// APIキーが設定済みかどうかを、仮想モジュール経由でクライアントに渡す。
// （鍵の値そのものは渡さない。define は dev では効かないため仮想モジュールを使う）
function jevConfigPlugin(keyConfigured: boolean): Plugin {
  const virtualId = 'virtual:jev-config';
  const resolvedId = '\0' + virtualId;
  return {
    name: 'jev-config',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        return `export const keyConfigured = ${JSON.stringify(keyConfigured)};`;
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  // VITE_ 接頭辞なしの環境変数も含めて読み込む（'' を渡すと全件）。
  // TYPESAFE_API_KEY はクライアントバンドルには出さず、下の dev proxy でだけ使う。
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.TYPESAFE_API_KEY ?? '';

  return {
    plugins: [react(), jevConfigPlugin(Boolean(apiKey))],
    server: {
      proxy: {
        // ブラウザは同一オリジンの /api/jev を叩く。ここで本番APIへ中継し、
        // Authorization ヘッダをサーバ側で注入する（CORS回避 + 鍵の非露出）。
        '/api/jev': {
          target: JEV_API_ORIGIN,
          changeOrigin: true,
          rewrite: () => JEV_API_PATH,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, _req: IncomingMessage) => {
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
              proxyReq.setHeader('Content-Type', 'application/json');
            });
          },
        },
      },
    },
  };
});
