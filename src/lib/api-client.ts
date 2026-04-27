export async function apiFetch<T>(url: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
  // Get session ID from sessionStorage for authenticated requests
  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || '' : '';
  
  const makeRequest = async (): Promise<Response> => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'x-session-id': sessionId }),
        ...options.headers,
      },
    });
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await makeRequest();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'API request failed');
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Retry on network errors or 5xx status codes
      const isRetryable = 
        lastError.message.includes('fetch') ||
        lastError.message.includes('Network') ||
        lastError.message.includes('500') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('504');
      
      if (attempt === retries - 1 || !isRetryable) {
        throw lastError;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError || new Error('API request failed after retries');
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
