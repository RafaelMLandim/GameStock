import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../GameContext";
import InstallApp from "./InstallApp";

type Mode = "login" | "matricula" | "senha" | "esqueci" | "gestao";

const INK = "#2b1a0e";
const line = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" as const };

function Cactus({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 250) scale(${s})`} fill="#5b8c3a" {...line}>
      <path d="M-6 0 L-6 -56 Q0 -64 6 -56 L6 0 Z" />
      <path d="M-6 -26 L-16 -26 Q-21 -26 -21 -32 L-21 -44 Q-17 -49 -13 -44 L-13 -33 L-6 -33" />
      <path d="M6 -18 L16 -18 Q21 -18 21 -24 L21 -38 Q17 -43 13 -38 L13 -25 L6 -25" />
    </g>
  );
}

/** Pistoleiro meio de lado (de costas, virado para a direita), de sobretudo e chapéu, com o revólver baixado na mão direita, olhando o deserto. */
function Gunslinger({ x }: { x: number }) {
  const coat = "#8b5a2b";
  const pants = "#3b5b8c";
  const hat = "#6b4226";
  const skin = "#e0a878";
  return (
    <g
      transform={`translate(${x} 0) scale(1.1) translate(0 -22)`}
      {...line}
      strokeWidth="1.8"
    >
      <ellipse
        cx="0"
        cy="250"
        rx="28"
        ry="4"
        fill="rgba(43,26,14,0.18)"
        stroke="none"
      />
      {/* virado para a direita: o lado esquerdo do corpo fica mais estreito e a bota direita aponta para fora */}
      <path d="M-7 200 L-10 240 L-2 240 L1 205 Z" fill={pants} />
      <path d="M10 200 L15 240 L6 240 L2 205 Z" fill={pants} />
      <path
        d="M-12 238 L-1 238 L0 250 L-15 250 Q-15 244 -12 238 Z"
        fill="#4a2c17"
      />
      <path d="M5 238 L17 238 Q23 243 25 250 L4 250 Z" fill="#4a2c17" />
      {/* sobretudo aberto embaixo, costura das costas fora do centro */}
      <path
        d="M-12 156 Q-11 150 -5 149 L10 149 Q16 150 16 156 Q21 185 28 222 L9 218 L2 202 L-5 218 L-21 222 Q-16 185 -12 156 Z"
        fill={coat}
      />
      <path
        d="M-2 158 L-1 200"
        fill="none"
        stroke="rgba(43,26,14,0.45)"
        strokeWidth="1.2"
      />
      {/* braços pendurados dos lados, saindo dos ombros */}
      <path
        d="M-12 154 Q-17 156 -18 166 L-18 194 L-12 194 L-11 168 Z"
        fill={coat}
      />
      <circle cx="-15" cy="197" r="3.2" fill={skin} />
      <path d="M15 154 Q21 156 22 166 L24 190 L18 191 L17 168 Z" fill={coat} />
      {/* revólver um pouco ampliado a partir da mão direita, apontado para o chão */}
      <g
        transform="translate(21 194) scale(1.25) translate(-27.5 -195)"
        strokeWidth="1.3"
      >
        <path d="M24 191 L31 190 L32 198 L25 199 Z" fill="#6b3e1e" />
        <circle cx="29" cy="201" r="2.8" fill="#8a8a8a" />
        <path d="M27 202 L31.5 202 L33.5 216 L29.5 216 Z" fill="#5c5c5c" />
      </g>
      <circle cx="21" cy="194" r="3.6" fill={skin} />
      {/* nuca, perfil do rosto aparecendo à direita, cabelo, orelha e chapéu inclinado */}
      <rect x="-3" y="140" width="8" height="9" fill={skin} />
      <path
        d="M3 129 Q10 131 10 136 L13 139 L10 141 Q10 147 4 147 Z"
        fill={skin}
      />
      <ellipse cx="-2" cy="136" rx="8.5" ry="10" fill="#5a3a20" />
      <ellipse
        cx="3.5"
        cy="137"
        rx="2.2"
        ry="3.2"
        fill={skin}
        strokeWidth="1.2"
      />
      <g transform="rotate(-5 0 131)">
        <ellipse cx="1" cy="131" rx="23" ry="5" fill={hat} />
        <path d="M-9 131 Q-9 115 1 118 Q11 115 11 131 Z" fill={hat} />
        <rect x="-9" y="126" width="20" height="4" fill={INK} strokeWidth="1" />
      </g>
    </g>
  );
}

/** Contorno da cidade ao longe (fachadas, igreja com torre e caixa d'água), com a base em y = 214. */
function TownOutline() {
  const b = 214;
  return (
    <>
      <path d={`M432 ${b} L432 ${b - 12} L436 ${b - 12} L436 ${b - 17} L452 ${b - 17} L452 ${b - 12} L456 ${b - 12} L456 ${b} Z`} />
      <rect x="458" y={b - 10} width="16" height="10" />
      <path d={`M476 ${b} L476 ${b - 16} L479 ${b - 16} L479 ${b - 22} L497 ${b - 22} L497 ${b - 16} L500 ${b - 16} L500 ${b} Z`} />
      <path d={`M503 ${b} L503 ${b - 14} L511 ${b - 22} L519 ${b - 14} L519 ${b} Z`} />
      <path d={`M508 ${b - 20} L508 ${b - 32} L511 ${b - 38} L514 ${b - 32} L514 ${b - 20} Z`} />
      <rect x="510.4" y={b - 44} width="1.2" height="7" />
      <rect x="508.5" y={b - 42} width="5" height="1.2" />
      <path d={`M522 ${b} L522 ${b - 13} L526 ${b - 13} L526 ${b - 18} L544 ${b - 18} L544 ${b - 13} L548 ${b - 13} L548 ${b} Z`} />
      <rect x="550" y={b - 9} width="20" height="9" />
      <rect x="573" y={b - 30} width="13" height="8" rx="1" />
      <path d={`M572 ${b - 30} L579.5 ${b - 35} L587 ${b - 30} Z`} />
      <path d={`M575 ${b} L576 ${b - 22} L577.4 ${b - 22} L576.6 ${b} Z M584 ${b} L583.2 ${b - 22} L584.6 ${b - 22} L585.6 ${b} Z`} />
      <path d={`M588 ${b} L588 ${b - 11} L606 ${b - 11} L606 ${b} Z`} />
      <path d={`M609 ${b} L609 ${b - 15} L612 ${b - 15} L612 ${b - 20} L627 ${b - 20} L627 ${b - 15} L630 ${b - 15} L630 ${b} Z`} />
      <rect x="632" y={b - 8} width="12" height="8" />
      <path d={`M646 ${b} L646 ${b - 24} L649 ${b - 24} L649 ${b - 29} L667 ${b - 29} L667 ${b - 24} L670 ${b - 24} L670 ${b} Z`} />
      <path d={`M672 ${b} L672 ${b - 12} L680 ${b - 17} L688 ${b - 12} L688 ${b} Z`} />
      <path d={`M690 ${b} L690 ${b - 14} L693 ${b - 14} L693 ${b - 18} L708 ${b - 18} L708 ${b - 14} L711 ${b - 14} L711 ${b} Z`} />
    </>
  );
}

/** A cidade no horizonte, à frente do pistoleiro: pequena (parece longe) e só a sombra. */
function HorizonTown() {
  return (
    <g fill="#5a3520" opacity="0.4" transform="translate(468 214) scale(0.85) translate(-519 -214)">
      <TownOutline />
    </g>
  );
}

/** Desenho do deserto atrás do login: sol, mesas de pedra, a cidade no horizonte, cactos, roda de carroça e caveira. */
function LoginScene() {
  return (
    <svg
      className="login-scene"
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <circle cx="560" cy="80" r="46" fill="#f6c34a" opacity="0.9" />
      <circle cx="560" cy="80" r="64" fill="#f6c34a" opacity="0.18" />
      {/* mesas de pedra ao longe */}
      <path
        d="M0 200 L40 200 L60 150 L170 150 L190 200 L330 200 L345 172 L420 172 L440 200 L560 200 L585 130 L700 130 L725 200 L800 200 L800 260 L0 260 Z"
        fill="#d48a54"
        opacity="0.6"
      />
      <HorizonTown />
      {/* chão */}
      <rect x="-2" y="248" width="804" height="60" fill="#d9b27a" />
      <path
        d="M260 272 Q290 266 320 272 M520 284 Q556 278 592 284"
        fill="none"
        stroke="#b58b52"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Cactus x={205} s={0.75} />
      <Cactus x={615} s={0.85} />
      <Gunslinger x={405} />
      {/* roda de carroça encostada */}
      <g
        transform="translate(560 232)"
        fill="none"
        stroke="#6b4a2b"
        strokeWidth="4"
      >
        <circle r="20" />
        <circle r="3" fill="#6b4a2b" />
        <path
          d="M0 -20 V20 M-20 0 H20 M-14 -14 L14 14 M14 -14 L-14 14"
          strokeWidth="2.5"
        />
      </g>
      {/* caveira de boi */}
      <g transform="translate(462 246)" {...line} strokeWidth="1.6">
        <path d="M-20 -14 Q-12 -6 -6 -10 M20 -14 Q12 -6 6 -10" fill="none" />
        <path d="M-8 -12 Q0 -16 8 -12 L6 2 Q0 6 -6 2 Z" fill="#f4ead2" />
        <circle cx="-3" cy="-6" r="1.6" fill={INK} />
        <circle cx="3" cy="-6" r="1.6" fill={INK} />
      </g>
      <g
        className="login-tumbleweed"
        fill="none"
        stroke="#a2723f"
        strokeWidth="2"
      >
        <circle r="11" />
        <path d="M-9 -3 Q0 6 9 -4 M-6 8 Q1 -8 8 6 M-11 1 Q0 -2 11 3" />
      </g>
    </svg>
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [matricula, setMatricula] = useState("");
  const [realName, setRealName] = useState("");
  // Nome que veio da planilha (vazio = a pessoa digita).
  const [rosterName, setRosterName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .setup()
      .then(({ needsAdmin }) => needsAdmin && setMode("gestao"))
      .catch(() =>
        setError("Não foi possível falar com o servidor. Ele está ligado?"),
      );
  }, []);

  const go = (next: Mode) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  };

  const run = async (work: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  };

  const mismatch =
    (mode === "senha" || mode === "esqueci") &&
    confirm !== "" &&
    confirm !== password;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login")
      run(async () => {
        const { token, user } = await api.login(matricula, password);
        signIn(token, user);
      });
    if (mode === "gestao")
      run(async () => {
        const { token, user } = await api.register(
          matricula,
          realName,
          password,
        );
        signIn(token, user);
      });
    if (mode === "matricula")
      run(async () => {
        const { name } = await api.signupCheck(matricula);
        setRosterName(name);
        setRealName(name);
        go("senha");
      });
    if (mode === "senha")
      run(async () => {
        await api.signup(
          matricula,
          password,
          rosterName ? undefined : realName,
        );
        setNotice(
          "Cadastro feito! Agora entre com sua matrícula e a senha que você criou.",
        );
        go("login");
      });
    if (mode === "esqueci")
      run(async () => {
        await api.resetPassword(matricula, code, password);
        setCode("");
        setNotice("Senha nova criada! Entre com sua matrícula e a senha nova.");
        go("login");
      });
  };

  const titles: Record<Mode, string> = {
    login: "🤠 Entrar no Oeste",
    matricula: "🐴 Primeiro acesso",
    senha: "🔒 Crie sua senha",
    esqueci: "🔑 Esqueci a senha",
    gestao: "⭐ Criar conta da gestão",
  };

  const canSubmit =
    !busy &&
    !!matricula.trim() &&
    (mode === "matricula" ||
      (mode === "login" && !!password) ||
      (mode === "gestao" && !!password && !!realName.trim()) ||
      (mode === "senha" &&
        !!password &&
        password === confirm &&
        !!realName.trim()) ||
      (mode === "esqueci" &&
        !!password &&
        password === confirm &&
        code.replace(/\D/g, "").length === 6));

  return (
    <div className="login-page">
      <LoginScene />
      <div className="login-wrap">
        <div className="login-sign">
          <div className="login-star" aria-hidden="true">
            ⭐
          </div>
          <h1>Fronteira do Estoque</h1>
          <p className="subtitle">A Jornada do Oeste</p>
        </div>
        <form className="panel form login" onSubmit={submit}>
          <h2>{titles[mode]}</h2>
          {mode === "gestao" && (
            <p className="hint">
              Nenhuma conta existe ainda. Esta primeira será a da gestão, que
              importa as matrículas, aprova distintivos e cuida das trocas.
            </p>
          )}
          {mode === "matricula" && (
            <p className="hint">
              Digite sua matrícula. Se ela estiver na lista da empresa, você
              cria sua senha em seguida.
            </p>
          )}
          {mode === "esqueci" && (
            <p className="hint">
              Peça para a gestão um código de 6 números. Com ele, você cria uma
              senha nova aqui. O código vale por 24 horas.
            </p>
          )}
          {notice && mode === "login" && <div className="ok">{notice}</div>}

          {mode === "senha" ? (
            <p className="login-who">
              Matrícula <b>{matricula}</b>
              {rosterName && (
                <>
                  {" "}
                  · <b>{rosterName}</b>
                </>
              )}
            </p>
          ) : (
            <label>
              {mode === "gestao" ? "Usuário" : "Matrícula"}
              <input
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                autoComplete="username"
                inputMode={mode === "gestao" ? "text" : "numeric"}
                placeholder={mode === "gestao" ? "ex.: gestao" : "ex.: 123456"}
                autoFocus
              />
            </label>
          )}

          {(mode === "gestao" || (mode === "senha" && !rosterName)) && (
            <label>
              Seu nome
              <input
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                autoComplete="name"
                placeholder="ex.: Ana Souza"
              />
            </label>
          )}

          {mode === "esqueci" && (
            <label>
              Código da gestão
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                placeholder="6 números"
              />
            </label>
          )}

          {mode !== "matricula" && (
            <label>
              {mode === "senha" || mode === "esqueci" ? "Senha nova" : "Senha"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                autoFocus={mode === "senha"}
              />
            </label>
          )}
          {(mode === "senha" || mode === "esqueci") && (
            <label>
              Repita a senha
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {mismatch && (
                <span className="game-bad">As senhas não são iguais.</span>
              )}
            </label>
          )}

          {error && <div className="error">{error}</div>}
          <button className="btn primary" disabled={!canSubmit}>
            {mode === "login"
              ? "Entrar"
              : mode === "matricula"
                ? "Continuar"
                : mode === "esqueci"
                  ? "Criar senha nova"
                  : "Criar conta"}
          </button>

          {mode === "login" && (
            <div className="login-links">
              <button
                type="button"
                className="link"
                onClick={() => (setNotice(""), go("matricula"))}
              >
                Primeiro acesso? Cadastre-se
              </button>
              <button
                type="button"
                className="link"
                onClick={() => (setNotice(""), go("esqueci"))}
              >
                Esqueci a senha
              </button>
            </div>
          )}
          {(mode === "matricula" || mode === "senha" || mode === "esqueci") && (
            <button type="button" className="link" onClick={() => go("login")}>
              ← Voltar para entrar
            </button>
          )}
        </form>
        <InstallApp />
      </div>
    </div>
  );
}
