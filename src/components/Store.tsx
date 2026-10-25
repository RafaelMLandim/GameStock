import { useState } from 'react';
import { CYCLE_BUDGET, ITEM_ICONS, MAX_ITEM_PRICE, MIN_ITEM_PRICE, suggestPrice } from '../data';
import { buyerBlock, orderBlock, pendingOrders, uid, whole } from '../game';
import { useGame } from '../GameContext';
import { sfx } from '../sound';
import type { Player, StoreItem, StoreOrder } from '../types';
import { plain } from './games/util';
import { Empty, Token } from './shared';

const PAGE_SIZE = 20;

const when = (at: number) => new Date(at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Texto de estoque e limite que aparece no card do item. */
function itemRules(item: StoreItem): string[] {
  const rules: string[] = [];
  if (item.stock !== undefined) rules.push(item.stock > 0 ? `Restam ${item.stock}` : 'Esgotado');
  if (item.limit !== undefined) rules.push(`Até ${item.limit} por pessoa`);
  return rules;
}

function ItemHead({ item }: { item: StoreItem }) {
  return (
    <>
      <span className="store-icon">{item.icon}</span>
      <strong>{item.name}</strong>
      <span className="badge gold">${item.price}</span>
      {itemRules(item).map((r) => (
        <span key={r} className={r === 'Esgotado' ? 'badge red' : 'muted store-rule'}>
          {r}
        </span>
      ))}
    </>
  );
}

export default function Store() {
  const { isAdmin, myPlayer } = useGame();
  return (
    <section>
      <h2>Armazém do Saloon</h2>
      {isAdmin ? <StoreAdmin /> : myPlayer ? <PlayerStore player={myPlayer} /> : <Empty>Crie seu personagem para trocar seus dólares.</Empty>}
    </section>
  );
}

/** Jogador: pede a troca; a gestão emite a nota de consumo e aprova. Os pedidos na fila reservam os dólares. */
function PlayerStore({ player }: { player: Player }) {
  const { state, dispatch } = useGame();
  const [msg, setMsg] = useState('');
  const waiting = pendingOrders(state, player.id);
  const reserved = waiting.reduce((sum, o) => sum + o.price, 0);

  return (
    <>
      <p className="hint">Peça a troca aqui. A gestão emite a nota de consumo e, quando aprovar, o valor sai da sua carteira e você retira o produto.</p>
      <div className="panel row compact">
        <span className="wallet">
          Sua carteira: <b>${player.dollars}</b>
        </span>
        {reserved > 0 && <span className="muted">${reserved} reservado(s) em pedido(s) esperando a gestão</span>}
        {msg && <span className="ok">{msg}</span>}
      </div>

      {state.storeItems.length === 0 ? (
        <Empty>O armazém está vazio.</Empty>
      ) : (
        <div className="store-grid">
          {state.storeItems.map((item) => {
            const block = orderBlock(state, item, player);
            const bought = player.purchases[item.id] ?? 0;
            const asked = waiting.filter((o) => o.itemId === item.id).length;
            const soldOut = item.stock !== undefined && item.stock <= 0;
            return (
              <div key={item.id} className={`panel store-item${!block ? ' affordable' : ''}${soldOut ? ' sold-out' : ''}`}>
                <ItemHead item={item} />
                {bought > 0 && <span className="muted store-rule">Você já trocou {bought}</span>}
                {asked > 0 && <span className="muted store-rule">⏳ {asked} pedido(s) esperando a gestão</span>}
                <button
                  className="btn primary"
                  disabled={!!block}
                  onClick={async () => {
                    if (!(await dispatch({ type: 'REQUEST_ORDER', order: { id: uid(), playerId: player.id, itemId: item.id } }))) return;
                    sfx.coins();
                    setMsg(`Pedido de ${item.icon} ${item.name} enviado! A gestão vai emitir a nota.`);
                  }}
                >
                  🛒 Pedir troca
                </button>
                {block && block !== 'Esgotado' && <span className="muted store-rule">{block}</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

type AdminView = 'fila' | 'resolvidos' | 'itens';

/** Gestão: fila de pedidos (na ordem em que chegaram), pedidos resolvidos e os itens do armazém. */
function StoreAdmin() {
  const { state } = useGame();
  const [view, setView] = useState<AdminView>('fila');
  const queue = pendingOrders(state);
  const done = state.orders.filter((o) => o.status !== 'pendente');

  return (
    <>
      <p className="hint">
        Cada pedido vem do celular do jogador. Emita a nota de consumo e aprove: só então os dólares saem da carteira e o pedido vai para Resolvidos.
      </p>
      <div className="chips badge-views">
        <button className={view === 'fila' ? 'chip selected' : 'chip'} onClick={() => setView('fila')}>
          📋 Fila de pedidos ({queue.length})
        </button>
        <button className={view === 'resolvidos' ? 'chip selected' : 'chip'} onClick={() => setView('resolvidos')}>
          ✅ Resolvidos ({done.length})
        </button>
        <button className={view === 'itens' ? 'chip selected' : 'chip'} onClick={() => setView('itens')}>
          📦 Itens do armazém
        </button>
      </div>
      {view === 'fila' && <OrderQueue queue={queue} />}
      {view === 'resolvidos' && <ResolvedOrders orders={done} />}
      {view === 'itens' && <StoreItems />}
    </>
  );
}

function OrderQueue({ queue }: { queue: StoreOrder[] }) {
  const { state } = useGame();
  const [open, setOpen] = useState<string | null>(null);
  if (queue.length === 0) return <Empty>Nenhum pedido esperando nota.</Empty>;
  return (
    <ol className="ranking-list queue-list">
      {queue.map((o, i) => {
        const player = state.players.find((p) => p.id === o.playerId);
        const item = state.storeItems.find((it) => it.id === o.itemId);
        return (
          <li key={o.id}>
            <button className={open === o.id ? 'ranking-row roster-row open' : 'ranking-row roster-row'} onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
              <span className="ranking-place">{i + 1}º</span>
              {player && <Token player={player} size={36} />}
              <span className="ranking-name">
                <strong>{player?.realName ?? 'Personagem removido'}</strong>
                <span className="muted">
                  {item ? `${item.icon} ${item.name}` : 'Item removido'} · pedido em {when(o.at)}
                </span>
              </span>
              <span className="ranking-points">${o.price}</span>
            </button>
            {open === o.id && <OrderReview order={o} player={player} item={item} onDone={() => setOpen(null)} />}
          </li>
        );
      })}
    </ol>
  );
}

function OrderReview({ order, player, item, onDone }: { order: StoreOrder; player?: Player; item?: StoreItem; onDone: () => void }) {
  const { dispatch } = useGame();
  const [note, setNote] = useState('');
  const block = !player ? 'Personagem removido' : !item ? 'Item removido do armazém' : buyerBlock({ ...item, price: order.price }, player);
  const resolve = async (approve: boolean) => {
    if (await dispatch({ type: 'RESOLVE_ORDER', orderId: order.id, approve, note })) {
      if (approve) sfx.coins();
      onDone();
    }
  };
  return (
    <div className="panel order-review">
      {player && (
        <p>
          <b>{player.codename}</b> · carteira agora: <b>${player.dollars}</b>
          {item && ` · depois da troca: $${player.dollars - order.price}`}
        </p>
      )}
      {block && <p className="game-bad">Não dá para aprovar: {block}. Recuse o pedido.</p>}
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação (ex.: número da nota) — opcional" />
      <div className="actions">
        <button className="btn primary" disabled={!!block} onClick={() => resolve(true)}>
          ✅ Nota emitida — aprovar
        </button>
        <button className="btn danger" onClick={() => resolve(false)}>
          ❌ Recusar
        </button>
      </div>
    </div>
  );
}

/** Pedidos aprovados e recusados, do mais recente para o mais antigo. */
function ResolvedOrders({ orders }: { orders: StoreOrder[] }) {
  const { state } = useGame();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const nameOf = (o: StoreOrder) => state.players.find((p) => p.id === o.playerId);
  const itemOf = (o: StoreOrder) => state.storeItems.find((i) => i.id === o.itemId);
  const query = plain(search.trim());
  const sorted = [...orders].sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
  const found = query ? sorted.filter((o) => plain(`${nameOf(o)?.realName ?? ''} ${nameOf(o)?.codename ?? ''}`).includes(query)) : sorted;
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);

  if (orders.length === 0) return <Empty>Nenhum pedido resolvido ainda.</Empty>;
  return (
    <>
      <div className="ranking-tools">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="🔎 Buscar pelo nome…"
          aria-label="Buscar pedido"
        />
      </div>
      {found.length === 0 ? (
        <Empty>Ninguém com esse nome.</Empty>
      ) : (
        <ul className="ranking-list">
          {found.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((o) => {
            const player = nameOf(o);
            const item = itemOf(o);
            return (
              <li key={o.id} className="ranking-row order-done">
                {player && <Token player={player} size={32} />}
                <span className="ranking-name">
                  <strong>{player?.realName ?? 'Personagem removido'}</strong>
                  <span className="muted">
                    {item ? `${item.icon} ${item.name}` : 'Item removido'} · ${o.price} · pedido {when(o.at)}
                  </span>
                  <span className="muted">
                    {o.status === 'aprovado' ? '✅ Aprovado' : '❌ Recusado'}
                    {o.resolvedAt ? ` em ${when(o.resolvedAt)}` : ''}
                    {o.resolvedBy ? ` por ${o.resolvedBy}` : ''}
                    {o.note ? ` · ${o.note}` : ''}
                  </span>
                </span>
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

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

/** Quanto o estoque dos itens custa para a empresa (um item pode ficar de fora, ao ser editado). */
function budgetUsed(items: StoreItem[], except?: string): number {
  return items.filter((i) => i.id !== except).reduce((sum, i) => sum + (i.stock ?? 0) * (i.cost ?? 0), 0);
}

/** Itens do armazém: a gestão cria e edita numa janela, com preço e estoque sugeridos para caber no orçamento. */
function StoreItems() {
  const { state, dispatch } = useGame();
  // null = janela fechada; 'novo' = item novo; ou o item em edição.
  const [editing, setEditing] = useState<StoreItem | 'novo' | null>(null);
  const used = budgetUsed(state.storeItems);
  return (
    <>
      <div className="section-head">
        <span className="muted">
          Estoque do ciclo: {reais(used)} de {reais(CYCLE_BUDGET)}
        </span>
        <button className="btn primary" onClick={() => setEditing('novo')}>
          ➕ Adicionar item
        </button>
      </div>
      {state.storeItems.length === 0 ? (
        <Empty>O armazém está vazio.</Empty>
      ) : (
        <div className="store-grid">
          {state.storeItems.map((item) => (
            <div key={item.id} className={`panel store-item${item.stock !== undefined && item.stock <= 0 ? ' sold-out' : ''}`}>
              <ItemHead item={item} />
              {item.cost !== undefined && <span className="muted store-rule">Custo {reais(item.cost)} cada</span>}
              <div className="actions">
                <button className="btn" onClick={() => setEditing(item)} aria-label={`Editar ${item.name}`}>
                  ✏️
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (confirm(`Remover "${item.name}" do armazém?`)) dispatch({ type: 'REMOVE_ITEM', id: item.id });
                  }}
                  aria-label={`Remover ${item.name}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <ItemModal
          initial={editing === 'novo' ? null : editing}
          items={state.storeItems}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            dispatch({ type: 'SAVE_ITEM', item });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Janela de criar ou editar item. A partir do custo em reais ela sugere o preço em dólares (na escala dos outros
 * itens), o estoque que cabe no que sobra do orçamento do ciclo e o limite por pessoa. Tudo em números inteiros.
 */
function ItemModal({ initial, items, onSave, onClose }: { initial: StoreItem | null; items: StoreItem[]; onSave: (item: StoreItem) => void; onClose: () => void }) {
  const [icon, setIcon] = useState(initial?.icon ?? '🎁');
  const [name, setName] = useState(initial?.name ?? '');
  const [cost, setCost] = useState(initial?.cost === undefined ? '' : String(initial.cost));
  // Campo vazio = usa a sugestão (aparece como dica dentro do campo).
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [stock, setStock] = useState(initial?.stock === undefined ? '' : String(initial.stock));
  const [limit, setLimit] = useState(initial?.limit === undefined ? '' : String(initial.limit));

  const costValue = Number(cost.replace(',', '.'));
  const hasCost = cost.trim() !== '' && costValue > 0;
  const free = Math.max(0, CYCLE_BUDGET - budgetUsed(items, initial?.id));
  const sugPrice = hasCost ? suggestPrice(costValue) : MIN_ITEM_PRICE;
  const sugStock = hasCost ? Math.floor(free / costValue) : 0;
  const sugLimit = sugPrice >= 25 ? 1 : 2;

  const priceValue = price.trim() === '' ? sugPrice : whole(Number(price));
  const stockValue = stock.trim() === '' ? (hasCost ? sugStock : undefined) : whole(Number(stock));
  const limitValue = limit.trim() === '' ? sugLimit : Math.max(1, whole(Number(limit)));
  const stockCost = hasCost && stockValue !== undefined ? stockValue * costValue : 0;

  const warnings: string[] = [];
  if (priceValue < MIN_ITEM_PRICE) warnings.push(`Abaixo de $${MIN_ITEM_PRICE} a pessoa troca antes de vencer as duas primeiras áreas.`);
  if (priceValue > MAX_ITEM_PRICE) warnings.push(`Acima de $${MAX_ITEM_PRICE} ninguém junta os dólares no ciclo (a jornada toda paga $33).`);
  if (stockCost > free)
    warnings.push(
      `Passa do orçamento: ${stockValue} unidade(s) × ${reais(costValue)} = ${reais(stockCost)}, mas dos ${reais(CYCLE_BUDGET)} do ciclo só sobram ${reais(free)}, porque o estoque dos outros itens já usa ${reais(CYCLE_BUDGET - free)}. Diminua o estoque de outro item (✏️) para abrir espaço.`,
    );
  if (!hasCost && stock.trim() !== '') warnings.push('Informe o custo para conferir se o estoque cabe no orçamento.');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal item-modal"
        role="dialog"
        aria-label={initial ? `Editar ${initial.name}` : 'Adicionar item'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSave({
            id: initial?.id ?? uid(),
            icon,
            name: name.trim(),
            price: Math.max(1, priceValue),
            stock: stockValue,
            limit: limitValue,
            cost: hasCost ? costValue : undefined,
          });
        }}
      >
        <div className="modal-head">
          <span className="mission-icon">{icon}</span>
          <div>
            <h2>{initial ? `Editar ${initial.name}` : 'Novo item no armazém'}</h2>
          </div>
          <button type="button" className="btn small modal-close" onClick={onClose} aria-label="Fechar">
            ✖
          </button>
        </div>

        <div className="field-label">Ícone</div>
        <div className="icon-grid">
          {ITEM_ICONS.map((i) => (
            <button key={i} type="button" className={i === icon ? 'icon-pick selected' : 'icon-pick'} onClick={() => setIcon(i)} aria-label={i} aria-pressed={i === icon}>
              {i}
            </button>
          ))}
        </div>

        <label>
          Nome do item
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Copo térmico" />
        </label>
        <label>
          Quanto cada um custa para a empresa (R$)
          <input type="number" min={0} step={0.01} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ex.: 12,50" />
        </label>

        <div className="row compact">
          <label>
            Preço ($)
            <input type="number" min={1} step={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(sugPrice)} />
          </label>
          <label>
            Estoque no ciclo
            <input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} placeholder={hasCost ? String(sugStock) : 'sem limite'} />
          </label>
          <label>
            Máx. por pessoa
            <input type="number" min={1} step={1} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder={String(sugLimit)} />
          </label>
        </div>

        <div className="item-suggest">
          {hasCost ? (
            <>
              <p>
                💡 Sugestão: <b>${sugPrice}</b>, <b>{sugStock}</b> unidade(s) e até <b>{sugLimit}</b> por pessoa. Os campos vazios usam a sugestão.
              </p>
              <p className="muted">
                Preço: com $1 por missão, a pessoa precisa vencer {priceValue} missões (umas {Math.ceil(priceValue / 4)} áreas). Estoque: sobram {reais(free)} de{' '}
                {reais(CYCLE_BUDGET)} no orçamento do ciclo.
              </p>
            </>
          ) : (
            <p className="muted">💡 Informe o custo em reais para o app sugerir o preço e o estoque sem quebrar a economia do jogo.</p>
          )}
          {warnings.map((w) => (
            <p key={w} className="game-bad">
              ⚠️ {w}
            </p>
          ))}
        </div>

        <div className="actions">
          <button className="btn primary" disabled={!name.trim()}>
            {initial ? '💾 Salvar' : '➕ Adicionar'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
