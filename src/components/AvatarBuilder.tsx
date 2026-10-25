import { useState } from 'react';
import {
  ACCESSORIES,
  CLOTH_COLORS,
  EYE_STYLES,
  FACIAL_HAIR,
  HAIR_ACCESSORIES,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  LEATHER_COLORS,
  LOOK_STYLES,
  MAKEUP,
  MOUTHS,
  SKIN_TONES,
  TOPS,
  fitLook,
  optionsFor,
  randomLook,
} from '../avatar';
import type { LookOption } from '../avatar';
import type { Accessory, AvatarLook, Makeup } from '../types';
import { PLAYER_COLORS } from '../data';
import AvatarFigure from './AvatarFigure';
import { BACKDROPS, SceneBox } from './Backdrops';

type Section = 'rosto' | 'cabelo' | 'chapeu' | 'roupa' | 'acessorios' | 'fundo';
type StyleField = 'eyes' | 'mouth' | 'facialHair' | 'hairStyle' | 'hat' | 'top';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'rosto', label: '🙂 Rosto' },
  { id: 'cabelo', label: '💇 Cabelo' },
  { id: 'chapeu', label: '🤠 Chapéu' },
  { id: 'roupa', label: '👕 Roupa' },
  { id: 'acessorios', label: '⭐ Acessórios' },
  { id: 'fundo', label: '🏜️ Fundo' },
];

function Swatches({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="builder-group">
      <div className="field-label">{label}</div>
      <div className="color-row">
        {colors.map((c) => (
          <button type="button" key={c} aria-label={`${label} ${c}`} className={value === c ? 'swatch selected' : 'swatch'} style={{ background: c }} onClick={() => onChange(c)} />
        ))}
      </div>
    </div>
  );
}

export default function AvatarBuilder({
  look,
  onChange,
  backdrop,
  color,
  onSceneChange,
}: {
  look: AvatarLook;
  onChange: (look: AvatarLook) => void;
  backdrop: string;
  color: string;
  onSceneChange: (scene: { backdrop?: string; color?: string }) => void;
}) {
  const [section, setSection] = useState<Section>('rosto');
  const set = (changes: Partial<AvatarLook>) => onChange({ ...look, ...changes });

  const toggleAccessory = (a: Accessory) =>
    set({ accessories: look.accessories.includes(a) ? look.accessories.filter((x) => x !== a) : [...look.accessories, a] });
  const toggleMakeup = (m: Makeup) => set({ makeup: look.makeup.includes(m) ? look.makeup.filter((x) => x !== m) : [...look.makeup, m] });
  const beards = optionsFor(FACIAL_HAIR, look.style);
  const makeup = optionsFor(MAKEUP, look.style);

  /** Linha de opções em que cada botão mostra o boneco já com aquela opção aplicada. */
  const styleOptions = (label: string, field: StyleField, options: LookOption<string>[], crop: 'full' | 'bust') => (
    <div className="builder-group">
      <div className="field-label">{label}</div>
      <div className="option-grid">
        {optionsFor(options, look.style).map((o) => {
          const changes = { [field]: o.id } as Partial<AvatarLook>;
          return (
            <button type="button" key={o.id} className={look[field] === o.id ? 'look-opt selected' : 'look-opt'} onClick={() => set(changes)}>
              <AvatarFigure look={{ ...look, ...changes }} crop={crop} size={crop === 'bust' ? 64 : 52} />
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );


  return (
    <div className="builder">
      <div className="builder-preview">
        <SceneBox className="builder-stage" backdrop={backdrop} color={color}>
          <AvatarFigure look={look} size={170} />
        </SceneBox>
        <button type="button" className="btn" onClick={() => onChange(randomLook(look.style))}>
          🎲 Sortear visual
        </button>
      </div>
      <div className="builder-controls">
        <div className="builder-group">
          <div className="field-label">Estilo do personagem</div>
          <div className="option-grid style-grid">
            {LOOK_STYLES.map((st) => (
              <button
                type="button"
                key={st.id}
                className={look.style === st.id ? 'look-opt selected' : 'look-opt'}
                onClick={() => onChange(fitLook({ ...look, style: st.id }))}
              >
                <span>{st.label}</span>
              </button>
            ))}
          </div>
          <p className="muted style-hint">
            {look.style === 'masculino'
              ? 'Mais opções de barba, bigode e cortes masculinos.'
              : look.style === 'feminino'
                ? 'Maquiagem, vestidos, laços e cortes femininos.'
                : 'Todas as opções liberadas: monte do seu jeito.'}
          </p>
        </div>
        <div className="builder-tabs">
          {SECTIONS.map((s) => (
            <button type="button" key={s.id} className={section === s.id ? 'chip selected' : 'chip'} onClick={() => setSection(s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {section === 'rosto' && (
          <>
            <Swatches label="Tom de pele" colors={SKIN_TONES} value={look.skin} onChange={(skin) => set({ skin })} />
            {styleOptions('Olhos', 'eyes', EYE_STYLES, 'bust')}
            {styleOptions('Boca', 'mouth', MOUTHS, 'bust')}
            {beards.length > 1 && styleOptions('Barba e bigode', 'facialHair', FACIAL_HAIR, 'bust')}
            {makeup.length > 0 && (
              <div className="builder-group">
                <div className="field-label">Maquiagem (escolha quantas quiser)</div>
                <div className="option-grid">
                  {makeup.map((m) => {
                    const on = look.makeup.includes(m.id);
                    return (
                      <button type="button" key={m.id} className={on ? 'look-opt selected' : 'look-opt'} onClick={() => toggleMakeup(m.id)}>
                        <AvatarFigure look={{ ...look, makeup: on ? look.makeup : [...look.makeup, m.id] }} crop="bust" size={64} />
                        <span>
                          {on ? '✓ ' : ''}
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        {section === 'cabelo' && (
          <>
            {styleOptions('Corte', 'hairStyle', HAIR_STYLES, 'bust')}
            <Swatches label="Cor do cabelo" colors={HAIR_COLORS} value={look.hairColor} onChange={(hairColor) => set({ hairColor })} />
          </>
        )}
        {section === 'chapeu' && (
          <>
            {styleOptions('Modelo', 'hat', HATS, 'bust')}
            <Swatches label="Cor do chapéu" colors={[...LEATHER_COLORS, ...CLOTH_COLORS]} value={look.hatColor} onChange={(hatColor) => set({ hatColor })} />
          </>
        )}
        {section === 'roupa' && (
          <>
            {styleOptions('Peça', 'top', TOPS, 'full')}
            <Swatches label="Cor principal" colors={CLOTH_COLORS} value={look.topColor} onChange={(topColor) => set({ topColor })} />
            <Swatches label="Cor de detalhe (colete, camisa, bandana, faixas)" colors={CLOTH_COLORS} value={look.accentColor} onChange={(accentColor) => set({ accentColor })} />
            <Swatches label="Calça" colors={CLOTH_COLORS} value={look.pantsColor} onChange={(pantsColor) => set({ pantsColor })} />
            <Swatches label="Botas" colors={LEATHER_COLORS} value={look.bootsColor} onChange={(bootsColor) => set({ bootsColor })} />
          </>
        )}
        {section === 'fundo' && (
          <>
            <div className="builder-group">
              <div className="field-label">Cenário</div>
              <div className="option-grid">
                {BACKDROPS.map((b) => (
                  <button type="button" key={b.id} className={backdrop === b.id ? 'look-opt selected' : 'look-opt'} onClick={() => onSceneChange({ backdrop: b.id })}>
                    <SceneBox className="backdrop-thumb" backdrop={b.id} color={color}>
                      <AvatarFigure look={look} crop="full" size={40} />
                    </SceneBox>
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Swatches label="Sua cor (marcador no mapa e fundo liso)" colors={PLAYER_COLORS} value={color} onChange={(c) => onSceneChange({ color: c })} />
          </>
        )}
        {section === 'acessorios' && (
          <div className="builder-group">
            <div className="field-label">Escolha quantos quiser</div>
            <div className="option-grid">
              {optionsFor(ACCESSORIES, look.style).map((a) => {
                const on = look.accessories.includes(a.id);
                const preview: AvatarLook = {
                  ...look,
                  hat: HAIR_ACCESSORIES.includes(a.id) ? 'nenhum' : look.hat,
                  accessories: on ? look.accessories : [...look.accessories, a.id],
                };
                return (
                  <button type="button" key={a.id} className={on ? 'look-opt selected' : 'look-opt'} onClick={() => toggleAccessory(a.id)}>
                    <AvatarFigure look={preview} crop="full" size={52} />
                    <span>
                      {on ? '✓ ' : ''}
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {look.accessories.some((a) => HAIR_ACCESSORIES.includes(a)) && look.hat !== 'nenhum' && (
              <p className="muted">Laço e flor no cabelo só aparecem quando o personagem está sem chapéu.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
