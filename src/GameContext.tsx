import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError, api, getToken, setToken } from './api';
import { initialState } from './data';
import type { Action } from './game';
import type { GameState, Player, User } from './types';

const POLL_MS = 4000;

interface GameContextValue {
  state: GameState;
  dispatch: (action: Action) => Promise<boolean>;
  user: User;
  isAdmin: boolean;
  myPlayer: Player | undefined;
  logout: () => void;
  error: string;
  clearError: () => void;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  signIn: (token: string, user: User) => void;
}

const GameContext = createContext<GameContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<GameState>(initialState);
  const [error, setError] = useState('');
  // Versão do jogo que já temos: o servidor só manda o jogo de novo quando ela muda.
  const version = useRef<number>();

  const logout = useCallback(() => {
    api.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        setUser(null);
        return;
      }
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    },
    [],
  );

  // Restaura a sessão salva ao abrir a página.
  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  // Mantém o jogo sincronizado com o que os outros jogadores e a gestão fazem.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    // Cada conta vê o jogo de um jeito (o jogador só recebe os próprios dados).
    version.current = undefined;
    const load = () =>
      api
        .state(version.current)
        .then((res) => {
          if (!alive || !res.state) return;
          version.current = res.version;
          setState(res.state);
        })
        .catch(handleError);
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user, handleError]);

  const dispatch = useCallback(
    async (action: Action) => {
      try {
        const res = await api.action(action);
        version.current = res.version;
        setState(res.state);
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [handleError],
  );

  const signIn = useCallback((token: string, user: User) => {
    setToken(token);
    setUser(user);
  }, []);

  const auth = { user, ready, signIn };

  return (
    <AuthContext.Provider value={auth}>
      {user ? (
        <GameContext.Provider
          value={{
            state,
            dispatch,
            user,
            isAdmin: user.role === 'admin',
            myPlayer: state.players.find((p) => p.userId === user.id),
            logout,
            error,
            clearError: () => setError(''),
          }}
        >
          {children}
        </GameContext.Provider>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de GameProvider');
  return ctx;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame precisa de um usuário logado');
  return ctx;
}
