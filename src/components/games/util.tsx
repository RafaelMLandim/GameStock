import { useEffect, useRef, useState } from 'react';
import type { MissionGame } from '../../types';

/** Props comuns a todo minijogo: o conteúdo e o aviso de fim (venceu ou não). */
export interface GameProps<K extends MissionGame['kind']> {
  game: Extract<MissionGame, { kind: K }>;
  onFinish: (won: boolean, detail?: string) => void;
}

export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Maiúsculas e sem acento, para comparar respostas ("Segurança" = "SEGURANCA"). */
export function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

export function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Relógio regressivo em segundos. `addSeconds` permite penalidades (valores negativos). */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void) {
  const deadline = useRef(Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const l = Math.max(0, (deadline.current - Date.now()) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(timer);
        endRef.current();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [running]);

  return {
    left,
    addSeconds: (s: number) => {
      deadline.current += s * 1000;
      setLeft(Math.max(0, (deadline.current - Date.now()) / 1000));
    },
  };
}

export function TimeBar({ left, total }: { left: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className={`timebar${pct < 25 ? ' danger' : ''}`} role="timer" aria-label={`${Math.ceil(left)} segundos`}>
      <div className="timebar-fill" style={{ width: `${pct}%` }} />
      <span>⏱️ {Math.ceil(left)}s</span>
    </div>
  );
}
