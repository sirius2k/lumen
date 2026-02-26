import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 토큰 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// API 함수들
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiClient.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data).then((r) => r.data),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then((r) => r.data),
};

export const notebooksApi = {
  list: () => apiClient.get('/notebooks').then((r) => r.data),
  get: (id: string) => apiClient.get(`/notebooks/${id}`).then((r) => r.data),
  create: (data: { title: string; description?: string }) =>
    apiClient.post('/notebooks', data).then((r) => r.data),
  update: (id: string, data: { title?: string; description?: string }) =>
    apiClient.patch(`/notebooks/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/notebooks/${id}`),
};

export const sourcesApi = {
  uploadFile: (notebookId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post(`/notebooks/${notebookId}/sources/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  addUrl: (notebookId: string, url: string, title?: string) =>
    apiClient
      .post(`/notebooks/${notebookId}/sources/url`, { url, title })
      .then((r) => r.data),
  delete: (notebookId: string, sourceId: string) =>
    apiClient.delete(`/notebooks/${notebookId}/sources/${sourceId}`),
};

export const chatApi = {
  getHistory: (notebookId: string) =>
    apiClient.get(`/notebooks/${notebookId}/chat/history`).then((r) => r.data),
};

export const notesApi = {
  list: (notebookId?: string) =>
    apiClient
      .get('/notes', { params: notebookId ? { notebookId } : {} })
      .then((r) => r.data),
  get: (id: string) => apiClient.get(`/notes/${id}`).then((r) => r.data),
  create: (data: { title: string; content?: string; notebookId?: string; tagIds?: string[] }) =>
    apiClient.post('/notes', data).then((r) => r.data),
  update: (id: string, data: { title?: string; content?: string; tagIds?: string[] }) =>
    apiClient.patch(`/notes/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/notes/${id}`),
};

export const tasksApi = {
  list: (params?: { status?: string; today?: boolean }) =>
    apiClient.get('/tasks', { params }).then((r) => r.data),
  create: (data: { title: string; description?: string; dueDate?: string; projectId?: string }) =>
    apiClient.post('/tasks', data).then((r) => r.data),
  update: (id: string, data: any) =>
    apiClient.patch(`/tasks/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};

export const projectsApi = {
  list: () => apiClient.get('/projects').then((r) => r.data),
  create: (data: { name: string; color?: string }) =>
    apiClient.post('/projects', data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};

export const calendarApi = {
  list: (params?: { start?: string; end?: string }) =>
    apiClient.get('/events', { params }).then((r) => r.data),
  create: (data: { title: string; startAt: string; endAt: string; allDay?: boolean; color?: string }) =>
    apiClient.post('/events', data).then((r) => r.data),
  update: (id: string, data: any) =>
    apiClient.patch(`/events/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/events/${id}`),
};

export const bookmarksApi = {
  list: (params?: { isRead?: boolean; tagId?: string }) =>
    apiClient.get('/bookmarks', { params }).then((r) => r.data),
  create: (data: { url: string; tagIds?: string[] }) =>
    apiClient.post('/bookmarks', data).then((r) => r.data),
  update: (id: string, data: any) =>
    apiClient.patch(`/bookmarks/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/bookmarks/${id}`),
};

export const tagsApi = {
  list: () => apiClient.get('/tags').then((r) => r.data),
  create: (data: { name: string; color?: string }) =>
    apiClient.post('/tags', data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/tags/${id}`),
};

export const aiApi = {
  briefing: () => apiClient.post('/ai/briefing').then((r) => r.data),
  search: (q: string) => apiClient.get('/ai/search', { params: { q } }).then((r) => r.data),
};
