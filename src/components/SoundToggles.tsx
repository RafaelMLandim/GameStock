import { useEffect, useState } from 'react';
import { onSoundPrefs, setSoundPrefs, soundPrefs } from '../sound';

/** Liga e desliga a música tema e os efeitos dos jogos (fica salvo no aparelho). */
export default function SoundToggles() {
  const [prefs, setPrefs] = useState(soundPrefs);
  useEffect(() => onSoundPrefs(() => setPrefs(soundPrefs())), []);
  return (
    <span className="sound-toggles">
      <button
        className={prefs.music ? 'btn small' : 'btn small off'}
        onClick={() => setSoundPrefs({ music: !prefs.music })}
        aria-pressed={prefs.music}
        title={prefs.music ? 'Desligar a música' : 'Ligar a música'}
      >
        🎵
      </button>
      <button
        className={prefs.effects ? 'btn small' : 'btn small off'}
        onClick={() => setSoundPrefs({ effects: !prefs.effects })}
        aria-pressed={prefs.effects}
        title={prefs.effects ? 'Desligar os efeitos sonoros' : 'Ligar os efeitos sonoros'}
      >
        {prefs.effects ? '🔊' : '🔇'}
      </button>
    </span>
  );
}
