/// <reference types="vite/client" />

// vite.config.ts の仮想モジュール。APIキーが設定済みかどうかのフラグを渡す。
// （鍵そのものはクライアントに出さない）
declare module 'virtual:jev-config' {
  export const keyConfigured: boolean;
}
