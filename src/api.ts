import { SeminarSession, Submission, SeminarStats } from './types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  message?: string;
}

/**
 * Robust JSON fetch helper that safely handles:
 * - Non-JSON / HTML responses (e.g. during server startup, reverse proxy 502/503)
 * - Browser differences (WebKit / Safari "The string did not match the expected pattern")
 * - HTTP status errors
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';

    // If server responded with error status
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        try {
          const errJson = await res.json();
          return { success: false, error: errJson.error || `HTTP ${res.status}` };
        } catch {
          return { success: false, error: `HTTP ${res.status}` };
        }
      }
      return { success: false, error: `Server status: ${res.status}` };
    }

    // Check if response is actually JSON before parsing
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data as ApiResponse<T>;
    }

    // Fallback if content-type was text/plain or missing but body is valid JSON text
    const text = await res.text();
    if (!text || text.trim().startsWith('<')) {
      // Received HTML (e.g. proxy error or fallback)
      return { success: false, error: 'Non-JSON server response' };
    }

    try {
      const parsed = JSON.parse(text);
      return parsed as ApiResponse<T>;
    } catch {
      return { success: false, error: 'Failed to parse JSON response' };
    }
  } catch (err: any) {
    // Network interruption, abort, or dev server reloading
    return {
      success: false,
      error: err?.message || 'Network error'
    };
  }
}

export async function getSessions(): Promise<SeminarSession[] | null> {
  const res = await safeFetchJson<SeminarSession[]>('/api/sessions');
  return res.success && Array.isArray(res.data) ? res.data : null;
}

export async function getStats(): Promise<SeminarStats | null> {
  const res = await safeFetchJson<SeminarStats>('/api/stats');
  return res.success && res.data ? res.data : null;
}

export async function getSubmissions(sessionId?: number): Promise<Submission[] | null> {
  const url = sessionId ? `/api/submissions?sessionId=${sessionId}` : '/api/submissions';
  const res = await safeFetchJson<Submission[]>(url);
  return res.success && Array.isArray(res.data) ? res.data : null;
}

export async function postSubmission(payload: {
  sessionId: number;
  nama: string;
  asalKampus: string;
  jawaban: string;
  komitmenPribadi?: string;
}): Promise<ApiResponse<Submission>> {
  return safeFetchJson<Submission>('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const res = await safeFetchJson<void>(`/api/submissions/${id}`, { method: 'DELETE' });
  return Boolean(res.success);
}

export async function clearSessionSubmissions(sessionId: number): Promise<boolean> {
  const res = await safeFetchJson<void>(`/api/submissions?sessionId=${sessionId}`, { method: 'DELETE' });
  return Boolean(res.success);
}

export async function clearAllSubmissions(): Promise<boolean> {
  const res = await safeFetchJson<void>('/api/submissions', { method: 'DELETE' });
  return Boolean(res.success);
}

export async function updateSubmission(
  id: string,
  payload: Partial<Submission>
): Promise<Submission | null> {
  const res = await safeFetchJson<Submission>(`/api/submissions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.success && res.data ? res.data : null;
}

export async function updateSession(
  id: number,
  payload: Partial<SeminarSession>
): Promise<SeminarSession | null> {
  const res = await safeFetchJson<SeminarSession>(`/api/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.success && res.data ? res.data : null;
}
