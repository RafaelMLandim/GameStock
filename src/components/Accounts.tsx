import { useEffect, useState } from 'react';
import { api, type Account } from '../api';
import { useGame } from '../GameContext';
import { plain } from './games/util';
import { Empty } from './shared';

const PAGE_SIZE = 20;

/**
 * Lê o que foi colado da planilha (ou um CSV): uma pessoa por linha, matrícula e nome separados por
 * tabulação (copiar do Excel), ponto e vírgula ou vírgula. Linhas de título são ignoradas.
 */
export function parseRoster(text: string): { matricula: string; name: string }[] {
  const seen = new Set<string>();
  const out: { matricula: string; name: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const cells = raw.split(/\t|;|,/).map((c) => c.trim().replace(/^"|"$/g, ''));
    const matricula = (cells[0] ?? '').replace(/\s+/g, '').toLowerCase();
    if (!/^[a-z0-9._-]{1,30}$/.test(matricula) || !/\d/.test(matricula) || seen.has(matricula)) continue;
    seen.add(matricula);
    out.push({ matricula, name: cells.slice(1).filter(Boolean).join(' ').slice(0, 80) });
  }
  return out;
}

/** Gestão: importar a planilha de matrículas, ver quem já se cadastrou e cuidar das senhas. */
export default function Accounts() {
  const { user } = useGame();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState('');
  const [codes, setCodes] = useState<Record<string, { code: string; expires: number }>>({});

  const load = () =>
    api
      .accounts()
      .then((r) => setAccounts(r.accounts))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const act = async (work: () => Promise<unknown>) => {
    setError('');
    try {
      await work();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  };

  if (!accounts) return error ? <p className="error">{error}</p> : <p className="muted">Carregando matrículas…</p>;

  const query = plain(search.trim());
  const found = query ? accounts.filter((a) => plain(`${a.matricula} ${a.name}`).includes(query)) : accounts;
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const registered = accounts.filter((a) => a.inRoster && a.user).length;
  const listed = accounts.filter((a) => a.inRoster).length;

  return (
    <>
      <div className="section-head">
        <span className="muted">
          {listed} matrícula(s) na lista · {registered} já se cadastraram
        </span>
        <button className="btn primary" onClick={() => setImporting(true)}>
          📥 Importar planilha
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {notice && <p className="ok">{notice}</p>}
      {importing && (
        <ImportRoster
          onClose={() => setImporting(false)}
          onDone={async (msg) => {
            setNotice(msg);
            setImporting(false);
            await load();
          }}
        />
      )}

      <div className="ranking-tools">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="🔎 Buscar por matrícula ou nome…"
          aria-label="Buscar matrícula"
        />
      </div>

      {found.length === 0 ? (
        <Empty>{accounts.length ? 'Ninguém com essa matrícula ou nome.' : 'Nenhuma matrícula ainda. Importe a planilha.'}</Empty>
      ) : (
        <ul className="ranking-list">
          {found.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((a) => {
            const code = a.user && codes[a.user.id];
            const me = a.user?.id === user.id;
            return (
              <li key={a.matricula} className="panel account-row">
                <div className="account-head">
                  <span className="ranking-name">
                    <strong>{a.name || 'Sem nome'}</strong>
                    <span className="muted">
                      Matrícula {a.matricula}
                      {a.user?.character && ` · 🤠 ${a.user.character}`}
                    </span>
                  </span>
                  <span className={a.user ? 'badge' : 'badge muted-badge'}>
                    {!a.user ? '⏳ Não se cadastrou' : a.user.role === 'admin' ? '⭐ Gestão' : '✅ Cadastrado'}
                  </span>
                </div>
                {code && (
                  <p className="reset-code">
                    Código para <b>{a.name}</b>: <b className="code">{code.code}</b> · vale até{' '}
                    {new Date(code.expires).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. Passe para a pessoa
                    usar em "Esqueci a senha".
                  </p>
                )}
                <div className="actions">
                  {a.user && (
                    <button
                      className="btn small"
                      onClick={() =>
                        act(async () => {
                          const r = await api.resetCode(a.user!.id);
                          setCodes((c) => ({ ...c, [a.user!.id]: r }));
                        })
                      }
                    >
                      🔑 Gerar código de senha
                    </button>
                  )}
                  {a.user && !me && (
                    <button
                      className="btn small"
                      onClick={() => {
                        const toAdmin = a.user!.role !== 'admin';
                        if (confirm(toAdmin ? `Dar acesso de gestão para ${a.name}?` : `Tirar o acesso de gestão de ${a.name}?`))
                          act(() => api.setRole(a.user!.id, toAdmin ? 'admin' : 'player'));
                      }}
                    >
                      {a.user.role === 'admin' ? '↩️ Tirar da gestão' : '⭐ Tornar gestor'}
                    </button>
                  )}
                  {!a.user && (
                    <button
                      className="btn small danger"
                      onClick={() => {
                        if (confirm(`Tirar a matrícula ${a.matricula} da lista?`)) act(() => api.removeRoster(a.matricula));
                      }}
                    >
                      🗑️ Tirar da lista
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn small" disabled={current === 0} onClick={() => setPage(current - 1)}>
            ◀ Anterior
          </button>
          <span>
            Página {current + 1} de {pages}
          </span>
          <button className="btn small" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Próxima ▶
          </button>
        </div>
      )}
    </>
  );
}

/** Janela de importar: colar as colunas Matrícula e Nome do Excel, ou escolher um arquivo CSV. */
function ImportRoster({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rows = parseRoster(text);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal item-modal" role="dialog" aria-label="Importar planilha" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="mission-icon">📥</span>
          <div>
            <h2>Importar matrículas</h2>
          </div>
          <button type="button" className="btn small modal-close" onClick={onClose} aria-label="Fechar">
            ✖
          </button>
        </div>
        <p className="muted">
          No Excel, selecione as colunas <b>Matrícula</b> e <b>Nome</b> (a matrícula primeiro), copie e cole aqui. Também dá para escolher um arquivo .csv.
          Matrículas que já estão na lista só têm o nome atualizado.
        </p>
        <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'123456\tAna Souza\n123457\tBruno Lima'} />
        <label className="btn">
          📄 Escolher arquivo .csv
          <input type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange={async (e) => e.target.files?.[0] && setText(await e.target.files[0].text())} />
        </label>
        {text.trim() && (
          <div className="item-suggest">
            <p>
              <b>{rows.length}</b> pessoa(s) encontrada(s){rows.some((r) => !r.name) ? ', algumas sem nome (elas digitam o nome no cadastro)' : ''}.
            </p>
            {rows.slice(0, 3).map((r) => (
              <p key={r.matricula} className="muted">
                {r.matricula} · {r.name || 'sem nome'}
              </p>
            ))}
            <p className="muted">⚠️ Se as matrículas começam com zero, confira se o Excel não tirou os zeros (formate a coluna como Texto antes de copiar).</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button
            className="btn primary"
            disabled={busy || rows.length === 0}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const r = await api.importRoster(rows);
                onDone(`Importado: ${r.added} matrícula(s) nova(s) e ${r.updated} nome(s) atualizado(s).`);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Erro inesperado.');
              } finally {
                setBusy(false);
              }
            }}
          >
            📥 Importar {rows.length || ''}
          </button>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
