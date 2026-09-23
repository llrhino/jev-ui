import { extractAnswers, extractUsage, inferAnswerKind, type CallResult } from '../api';
import { TYPE_LABELS } from '../labels';
import type {
  Answer,
  ChoiceAnswer,
  ChoiceQuestion,
  JevRequest,
  NoulAnswer,
  Question,
  ScoreAnswer,
  ScoreQuestion,
} from '../types';

interface Props {
  result: CallResult | null;
  loading: boolean;
  /** 実行時に送ったリクエスト。答えを「何を聞いたか」とひも付けるために使う */
  request: JevRequest | null;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function ResultView({ result, loading, request }: Props) {
  if (loading) {
    return <div className="result placeholder">実行中… Jev が判定しています。</div>;
  }
  if (!result) {
    return (
      <div className="result placeholder">
        入力を用意して「実行する」を押すと、ここに結果が分かりやすく表示されます。
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="result">
        <div className="error-box" role="alert">
          <div className="error-title">うまくいきませんでした</div>
          <p className="error-message">{result.errorMessage}</p>
        </div>
      </div>
    );
  }

  const answers = extractAnswers(result.data);
  const usage = extractUsage(result.data);
  const model = result.data?.model;

  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="result">
        <div className="info-box">
          応答は受け取りましたが、答え(answers)が見つかりませんでした。右の「返ってきたデータ(JSON)」を確認してください。
        </div>
      </div>
    );
  }

  return (
    <div className="result">
      {(model || usage) && (
        <div className="result-meta">
          {model && (
            <span>
              モデル: <code>{model}</code>
            </span>
          )}
          {usage && (
            <span>
              入力 {usage.input_tokens ?? '—'} トークン / 出力 {usage.output_tokens ?? '—'} トークン
            </span>
          )}
        </div>
      )}

      <div className="answer-list">
        {Object.entries(answers).map(([id, answer]) => (
          <AnswerCard key={id} id={id} answer={answer} question={request?.questions?.[id]} />
        ))}
      </div>
    </div>
  );
}

function AnswerCard({
  id,
  answer,
  question,
}: {
  id: string;
  answer: Answer;
  question?: Question;
}) {
  const kind = inferAnswerKind(answer);
  const typeLabel = kind === 'unknown' ? '不明なタイプ' : TYPE_LABELS[kind].label;
  const icon = kind === 'unknown' ? '❔' : TYPE_LABELS[kind].icon;
  const instructions = question?.instructions;

  return (
    <div className="answer-card">
      <div className="answer-head">
        <span className="answer-id">{id}</span>
        <span className="answer-type">
          {icon} {typeLabel}
        </span>
      </div>
      {instructions && <p className="answer-question">「{instructions}」への答え</p>}
      {kind === 'choice' && (
        <ChoiceView
          answer={answer as ChoiceAnswer}
          question={question?.type === 'choice' ? (question as ChoiceQuestion) : undefined}
        />
      )}
      {kind === 'score' && (
        <ScoreView
          answer={answer as ScoreAnswer}
          question={question?.type === 'score' ? (question as ScoreQuestion) : undefined}
        />
      )}
      {kind === 'noul' && <NoulView answer={answer as NoulAnswer} />}
      {kind === 'unknown' && (
        <pre className="json-block small">
          <code>{JSON.stringify(answer, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}

function ChoiceView({ answer, question }: { answer: ChoiceAnswer; question?: ChoiceQuestion }) {
  const probs = answer.probabilities ?? {};
  const entries = Object.entries(probs).sort((a, b) => b[1] - a[1]);
  const winner = answer.choice ?? entries[0]?.[0] ?? '';
  // 説明はレスポンスの legend を優先し、無ければ送ったrubricで補う
  const desc = (key: string) => answer.legend?.[key] ?? question?.criteria?.[key];
  const winnerDesc = desc(winner);

  return (
    <div className="answer-body">
      {winner && (
        <div className="headline">
          選ばれた答え: <strong>{winnerDesc ?? winner}</strong>
          {winnerDesc && <code className="bar-key">{winner}</code>}
        </div>
      )}
      <div className="bars">
        {entries.map(([opt, p]) => {
          const d = desc(opt);
          return (
            <div className={`bar-row${opt === winner ? ' is-winner' : ''}`} key={opt}>
              <div className="bar-head">
                <span className="bar-label">
                  {d ?? opt}
                  {d && <code className="bar-key">{opt}</code>}
                </span>
                <span className="bar-value">{pct(p)}</span>
              </div>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: pct(p) }} />
              </span>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="subtle">
            各選択肢の確率(probabilities)が見つかりませんでした。右のJSONで実際の形をご確認ください。
          </p>
        )}
      </div>
      {typeof answer.confidence === 'number' && <ConfidenceMeter value={answer.confidence} />}
    </div>
  );
}

function ScoreView({ answer, question }: { answer: ScoreAnswer; question?: ScoreQuestion }) {
  const score = answer.score;
  const rubric = question?.criteria ?? [];
  const legend = answer.legend;

  // レベル→確率 を、レベル番号順に並べる（実APIは probabilities オブジェクト。
  // 旧想定の distribution 配列にも後方互換で対応）
  let levelProbs: Array<{ index: number; p: number }> = [];
  if (answer.probabilities && typeof answer.probabilities === 'object') {
    levelProbs = Object.entries(answer.probabilities)
      .map(([k, v]) => ({ index: Number(k), p: v }))
      .filter((x) => Number.isFinite(x.index))
      .sort((a, b) => a.index - b.index);
  } else if (Array.isArray(answer.distribution)) {
    levelProbs = answer.distribution.map((p, i) => ({ index: i, p }));
  }

  // 説明は legend を優先、無ければ送ったrubricで補う
  const labelFor = (i: number): string | undefined => legend?.[String(i)] ?? rubric[i];

  // 段階の最大index は legend / probabilities / rubric から決める
  const indices = [
    ...levelProbs.map((x) => x.index),
    ...(legend ? Object.keys(legend).map(Number) : []),
    ...(rubric.length ? [rubric.length - 1] : []),
  ].filter((n) => Number.isFinite(n) && n >= 0);
  const maxIndex = indices.length ? Math.max(...indices) : 0;

  // 最も確率の高いレベル（バー強調用）
  const topIndex = levelProbs.length
    ? levelProbs.reduce((best, cur) => (cur.p > best.p ? cur : best)).index
    : null;

  const nearest = typeof score === 'number' ? Math.min(maxIndex, Math.max(0, Math.round(score))) : null;
  const nearestDesc = nearest !== null ? labelFor(nearest) : undefined;

  return (
    <div className="answer-body">
      {typeof score === 'number' && (
        <>
          <div className="score-headline">
            <span className="score-value">{score.toFixed(2)}</span>
            <span className="score-scale">
              / {maxIndex}（0〜{maxIndex} の範囲）
            </span>
          </div>
          {nearest !== null && (
            <p className="score-nearest">
              いちばん近い段階: <strong>レベル {nearest}</strong>
              {nearestDesc && <span className="headline-desc">（{nearestDesc}）</span>}
            </p>
          )}
        </>
      )}
      {levelProbs.length > 0 && (
        <div className="bars">
          {levelProbs.map(({ index, p }) => {
            const label = labelFor(index);
            return (
              <div className={`bar-row${index === topIndex ? ' is-winner' : ''}`} key={index}>
                <div className="bar-head">
                  <span className="bar-label">
                    {label ?? `レベル ${index}`}
                    {label && <code className="bar-key">レベル {index}</code>}
                  </span>
                  <span className="bar-value">{pct(p)}</span>
                </div>
                <span className="bar-track">
                  <span className="bar-fill score" style={{ width: pct(p) }} />
                </span>
              </div>
            );
          })}
        </div>
      )}
      {typeof answer.confidence === 'number' && <ConfidenceMeter value={answer.confidence} />}
    </div>
  );
}

function NoulView({ answer }: { answer: NoulAnswer }) {
  const p = typeof answer.noul === 'number' ? answer.noul : null;
  if (p === null) {
    return <p className="subtle answer-body">「はい」の確率が取得できませんでした。</p>;
  }
  const uncertain = Math.abs(p - 0.5) < 0.15;
  const verdict = p >= 0.5 ? 'はい' : 'いいえ';

  return (
    <div className="answer-body">
      <div className="headline">
        判定: <strong>{verdict}</strong>（「はい」の確率 {pct(p)}）
      </div>
      <div className="noul-meter" title={`はい ${pct(p)}`}>
        <span className="noul-fill" style={{ width: pct(p) }} />
        <span className="noul-mid" />
      </div>
      <div className="noul-legend">
        <span>いいえ</span>
        <span>はい</span>
      </div>
      {uncertain && <p className="subtle">50%に近く、Jev もはっきりとは判断できていない状態です。</p>}
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="confidence">
      <span className="confidence-label">確信度</span>
      <span className="confidence-track">
        <span className="confidence-fill" style={{ width: pct(value) }} />
      </span>
      <span className="confidence-value">{pct(value)}</span>
    </div>
  );
}
