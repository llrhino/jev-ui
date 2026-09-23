import { PRESETS, type Preset } from '../presets';

interface Props {
  activePreset: string | null;
  onLoad: (preset: Preset) => void;
  onClear: () => void;
}

export function PresetBar({ activePreset, onLoad, onClear }: Props) {
  return (
    <div className="preset-bar">
      <div className="preset-bar-head">
        <span className="preset-title">まず例から試す</span>
        <button className="link-button" onClick={onClear} type="button">
          入力をクリア
        </button>
      </div>
      <div className="preset-list">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`preset-card${activePreset === p.id ? ' is-active' : ''}`}
            onClick={() => onLoad(p)}
            title={p.description}
          >
            <span className="preset-name">{p.name}</span>
            <span className="preset-desc">{p.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
