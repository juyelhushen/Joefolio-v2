import { useEffectsPreference } from '../../hooks/useEffectsPreference';
import './EffectsPreferenceToggle.css';

type EffectsPreferenceToggleProps = {
  className?: string;
};

export default function EffectsPreferenceToggle({ className = '' }: EffectsPreferenceToggleProps) {
  const { reducedEffects, setReducedEffects } = useEffectsPreference();

  return (
    <button
      className={`effects-preference-toggle ${className}`.trim()}
      type="button"
      aria-pressed={reducedEffects}
      onClick={() => setReducedEffects(!reducedEffects)}
    >
      Reduce effects
    </button>
  );
}
