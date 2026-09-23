interface Props {
  model: string;
  onChange: (v: string) => void;
}

export function ModelField({ model, onChange }: Props) {
  return (
    <div className="field">
      <label className="field-label" htmlFor="model">
        使うモデル
      </label>
      <input
        id="model"
        className="text-input"
        type="text"
        value={model}
        onChange={(e) => onChange(e.target.value)}
        placeholder="jev-latest"
      />
      <p className="field-hint">通常はそのままで大丈夫です（既定: jev-latest）。</p>
    </div>
  );
}
