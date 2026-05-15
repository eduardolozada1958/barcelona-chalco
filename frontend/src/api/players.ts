import { apiClient } from './client';
import type { ApiResponse } from './types';

export async function listPlayersPublic(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/players/public', { params });
  return data;
}

export async function getPlayerPublic(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/players/public/${id}`);
  return data;
}

export interface SeasonLeaderRow {
  player_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  category: string;
  jersey_number: number | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

export interface SeasonLeadersPayload {
  scoring: SeasonLeaderRow[];
  discipline: SeasonLeaderRow[];
}

export async function getSeasonLeadersPublic(limit = 15) {
  const { data } = await apiClient.get<ApiResponse<SeasonLeadersPayload>>('/players/public/season-leaders', {
    params: { limit },
  });
  return data;
}

/** Carga jugadores del once titular por ID (endpoint público por jugador). */
export async function fetchPlayersPublicByIds(ids: string[]): Promise<Record<string, unknown>[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const rows = await Promise.all(
    unique.map(async (playerId) => {
      try {
        const res = await getPlayerPublic(playerId);
        return res.data as Record<string, unknown>;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is Record<string, unknown> => r != null);
}

export interface CreatePlayerBody {
  firstName:         string;
  lastName:          string;
  birthDate:         string;
  nationality?:      string;
  position:          string;
  secondaryPosition?: string;
  jerseyNumber?:     number;
  dominantFoot?:     'right' | 'left' | 'both';
  heightCm?:         number;
  weightKg?:         number;
  category:          'Sub-11' | 'Sub-13' | 'Sub-15' | 'Sub-17' | 'Sub-20';
  sportDescription?: string;
  achievements?:    string;
  notes?:            string;
  curp?:             string;
}

export async function listPlayersAdmin(params?: Record<string, string | number | undefined>) {
  const { data } = await apiClient.get<ApiResponse<unknown[]>>('/players', { params });
  return data;
}

export async function createPlayer(body: CreatePlayerBody) {
  const { data } = await apiClient.post<ApiResponse<unknown>>('/players', body);
  return data;
}

function appendIfForm(fd: FormData, key: string, value: string | number | undefined | null) {
  if (value === undefined || value === null || value === '') return;
  fd.append(key, String(value));
}

/** Payload de `data` en la respuesta de alta con documentos (puede incluir bandera si la CURP salió del PDF). */
export type CreatePlayerWithDocumentsData = Record<string, unknown> & {
  curpFilledFromPdf?: boolean;
};

/** Alta desde el panel con PDF de CURP (obligatorio) y foto opcional (PNG/JPEG/WebP). */
export async function createPlayerWithDocuments(
  body: CreatePlayerBody,
  files: { curpPdf: File; photo?: File | undefined },
): Promise<ApiResponse<CreatePlayerWithDocumentsData>> {
  const fd = new FormData();
  fd.append('firstName', body.firstName);
  fd.append('lastName', body.lastName);
  fd.append('birthDate', body.birthDate);
  appendIfForm(fd, 'nationality', body.nationality);
  fd.append('position', body.position);
  appendIfForm(fd, 'secondaryPosition', body.secondaryPosition);
  appendIfForm(fd, 'jerseyNumber', body.jerseyNumber);
  fd.append('dominantFoot', body.dominantFoot ?? 'right');
  appendIfForm(fd, 'heightCm', body.heightCm);
  appendIfForm(fd, 'weightKg', body.weightKg);
  fd.append('category', body.category);
  appendIfForm(fd, 'sportDescription', body.sportDescription);
  appendIfForm(fd, 'achievements', body.achievements);
  appendIfForm(fd, 'notes', body.notes);
  appendIfForm(fd, 'curp', body.curp);
  fd.append('curpPdf', files.curpPdf);
  if (files.photo) fd.append('photo', files.photo);

  const { data } = await apiClient.postForm<ApiResponse<CreatePlayerWithDocumentsData>>('/players/with-documents', fd, {
    timeout: 120_000,
  });
  return data;
}

/** Solo admin: URL firmada (corta) para abrir el PDF de CURP en otra pestaña. */
export async function getPlayerCurpSignedUrl(playerId: string) {
  const { data } = await apiClient.get<ApiResponse<{ url: string }>>(`/players/${playerId}/curp-document`);
  return data;
}

export type UpdatePlayerBody = Omit<Partial<CreatePlayerBody>, 'curp'> & {
  curp?: string | null;
  status?: 'active' | 'inactive';
  isVerified?: boolean;
};

export async function updatePlayer(id: string, body: UpdatePlayerBody) {
  const { data } = await apiClient.put<ApiResponse<unknown>>(`/players/${id}`, body);
  return data;
}

/** Sube nueva foto del jugador (PNG/JPEG/WebP). */
export async function uploadPlayerPhoto(playerId: string, file: File) {
  const fd = new FormData();
  fd.append('photo', file);
  const { data } = await apiClient.post<ApiResponse<unknown>>(`/players/${playerId}/photo`, fd, {
    timeout: 90_000,
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers === 'object') {
          delete (headers as Record<string, unknown>)['Content-Type'];
        }
        return body as FormData;
      },
    ],
  });
  return data;
}

export async function getPlayerAdmin(id: string) {
  const { data } = await apiClient.get<ApiResponse<unknown>>(`/players/${id}`);
  return data;
}

export async function verifyPlayer(id: string) {
  const { data } = await apiClient.patch<ApiResponse<unknown>>(`/players/${id}/verify`);
  return data;
}

export async function generatePlayerQr(id: string) {
  const { data } = await apiClient.patch<ApiResponse<{ qrToken: string }>>(`/players/${id}/generate-qr`);
  return data;
}
