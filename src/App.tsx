import { useMemo, useState } from 'react';
import { callJev, type CallResult } from './api';
import {
  buildRequest,
  createEmptyStateDraft,
  createQuestionEntry,
  DEFAULT_MODEL,
  getValidationErrors,
  makeKey,
  questionToDraft,
  stateValueToDraft,
} from './draft';
import type { JevRequest, QuestionDraft, QuestionEntry, QuestionType, StateDraft } from './types';
import type { Preset } from './presets';
import { keyConfigured as KEY_CONFIGURED } from 'virtual:jev-config';
import { Header } from './components/Header';
import { PresetBar } from './components/PresetBar';
import { ModelField } from './components/ModelField';
import { StateEditor } from './components/StateEditor';
import { QuestionList } from './components/QuestionList';
import { RequestPreview } from './components/RequestPreview';
import { ResultView } from './components/ResultView';
import { RawJson } from './components/RawJson';

export default function App() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [stateDraft, setStateDraft] = useState<StateDraft>(() => createEmptyStateDraft());
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [result, setResult] = useState<CallResult | null>(null);
  const [sentRequest, setSentRequest] = useState<JevRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const request = useMemo(
    () => buildRequest(model, stateDraft, entries),
    [model, stateDraft, entries],
  );
  const errors = useMemo(
    () => getValidationErrors(stateDraft, entries),
    [stateDraft, entries],
  );

  function loadPreset(preset: Preset) {
    setModel(preset.model);
    setStateDraft(stateValueToDraft(preset.state));
    setEntries(
      preset.questions.map(([id, q]) => ({ key: makeKey(), id, draft: questionToDraft(q) })),
    );
    setResult(null);
    setActivePreset(preset.id);
  }

  function clearAll() {
    setModel(DEFAULT_MODEL);
    setStateDraft(createEmptyStateDraft());
    setEntries([]);
    setResult(null);
    setActivePreset(null);
  }

  function addQuestion(type: QuestionType) {
    setEntries((prev) => [...prev, createQuestionEntry(type, prev.map((e) => e.id))]);
  }
  function updateEntryId(key: string, id: string) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, id } : e)));
  }
  function updateEntryDraft(key: string, draft: QuestionDraft) {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, draft } : e)));
  }
  function removeEntry(key: string) {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  }
  function moveEntry(key: string, dir: -1 | 1) {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function run() {
    if (errors.length > 0 || loading) return;
    setLoading(true);
    setResult(null);
    // 送った瞬間のリクエストを控えておき、結果を「何を聞いたか」とひも付ける
    const sent = request;
    setSentRequest(sent);
    const res = await callJev(sent);
    setResult(res);
    setLoading(false);
  }

  const canRun = errors.length === 0 && !loading;

  return (
    <div className="app">
      <Header keyConfigured={KEY_CONFIGURED} />

      <main className="container">
        <PresetBar activePreset={activePreset} onLoad={loadPreset} onClear={clearAll} />

        {/* ① 入力フォーム ＋ 送られるJSON */}
        <section className="grid-2">
          <div className="col">
            <div className="section-head">
              <span className="step-badge">①</span>
              <h2>入力（フォーム）</h2>
            </div>
            <ModelField model={model} onChange={setModel} />
            <StateEditor draft={stateDraft} onChange={setStateDraft} />
            <QuestionList
              entries={entries}
              onAdd={addQuestion}
              onChangeId={updateEntryId}
              onChangeDraft={updateEntryDraft}
              onRemove={removeEntry}
              onMove={moveEntry}
            />
          </div>

          <div className="col">
            <div className="section-head">
              <h2>これから送るデータ（JSON）</h2>
            </div>
            <RequestPreview request={request} />
          </div>
        </section>

        {/* 実行バー */}
        <div className="run-bar">
          {errors.length > 0 && (
            <div className="validation" role="alert">
              <strong>入力を確認してください：</strong>
              <ul>
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <button className="run-button" onClick={run} disabled={!canRun}>
            {loading ? '実行中…' : '▶ 実行する'}
          </button>
          {!KEY_CONFIGURED && (
            <p className="run-note">
              ※ APIキーが未設定です。実行するとエラーになります（
              <code>.env</code> に <code>TYPESAFE_API_KEY</code> を設定してください）。
            </p>
          )}
        </div>

        {/* ② 結果 ＋ 返ってきたJSON */}
        <section className="grid-2">
          <div className="col">
            <div className="section-head">
              <span className="step-badge">②</span>
              <h2>結果（わかりやすく）</h2>
            </div>
            <ResultView result={result} loading={loading} request={sentRequest} />
          </div>
          <div className="col">
            <div className="section-head">
              <h2>返ってきたデータ（JSON）</h2>
            </div>
            <RawJson result={result} loading={loading} />
          </div>
        </section>

        <footer className="footer">
          <p>
            Jev / TypeSafe AI のプレイグラウンド（ローカル用）。送信先:{' '}
            <code>POST /api/jev</code> → <code>https://api.typesafe.ai/v1/systemone</code>
          </p>
        </footer>
      </main>
    </div>
  );
}
