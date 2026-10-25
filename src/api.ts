import type { Action } from './game';
import type { GameState, User } from './types';

const TOKEN_KEY = 'fronteira-do-estoque:token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sem armazenamento: a sessão dura só enquanto a página estiver aberta */
  }
}

/** Linha da tela de matrículas da gestão. */
export interface Account {
  matricula: string;
  name: string;
  /** Veio da planilha (as contas de fora são a primeira da gestão e as de teste). */
  inRoster: boolean;
  /** Sem conta = ainda não se cadastrou. */
  user?: { id: string; role: 'admin' | 'player'; character?: string };
}

interface Synced {
  state: GameState;
  version: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'Erro de comunicação com o servidor.', res.status);
  return data as T;
}

export const api = {
  setup: () => request<{ needsAdmin: boolean }>('GET', '/api/setup'),
  /** Primeira conta do sistema (gestão): entra direto. */
  register: (username: string, realName: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/api/register', { username, realName, password }),
  /** Cadastro pela matrícula da planilha: não entra direto, volta para o login. */
  signupCheck: (matricula: string) => request<{ name: string }>('POST', '/api/signup/check', { matricula }),
  signup: (matricula: string, password: string, realName?: string) =>
    request<{ ok: boolean }>('POST', '/api/register', { username: matricula, password, realName }),
  resetPassword: (matricula: string, code: string, password: string) =>
    request<{ ok: boolean }>('POST', '/api/password-reset', { matricula, code, password }),
  accounts: () => request<{ accounts: Account[] }>('GET', '/api/accounts'),
  importRoster: (entries: { matricula: string; name: string }[]) => request<{ added: number; updated: number }>('POST', '/api/roster', { entries }),
  removeRoster: (matricula: string) => request<{ ok: boolean }>('DELETE', `/api/roster/${encodeURIComponent(matricula)}`),
  resetCode: (userId: string) => request<{ code: string; expires: number }>('POST', `/api/accounts/${userId}/reset`),
  setRole: (userId: string, role: 'admin' | 'player') => request<{ ok: boolean }>('POST', `/api/accounts/${userId}/role`, { role }),
  login: (username: string, password: string) => request<{ token: string; user: User }>('POST', '/api/login', { username, password }),
  logout: () => request<{ ok: boolean }>('POST', '/api/logout'),
  me: () => request<{ user: User }>('GET', '/api/me'),
  /** Sem mudanças desde a versão informada, volta sem `state`. */
  state: (version?: number) => request<Partial<Synced>>('GET', version === undefined ? '/api/state' : `/api/state?v=${version}`),
  action: (action: Action) => request<Synced>('POST', '/api/action', { action }),
  uploadPhoto: (data: string) => request<{ id: string }>('POST', '/api/photos', { data }),
  /** A foto exige login, então vem por fetch (com o token) e vira um endereço local. */
  photoUrl: async (id: string): Promise<string> => {
    const token = getToken();
    const res = await fetch(`/api/photos/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new ApiError('Foto não encontrada.', res.status);
    return URL.createObjectURL(await res.blob());
  },
};

/** Reduz a foto da câmera (fotos de celular têm vários MB) para um JPEG leve. */
export async function shrinkPhoto(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.75);
}
