const PASSWORD_KEY = 'dashboard-password'

export function getDashboardPassword () {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(PASSWORD_KEY) ?? ''
}

export function setDashboardPassword (password: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PASSWORD_KEY, password)
}

async function request<T> (path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const password = getDashboardPassword()
  if (password) headers.set('x-admin-password', password)

  const response = await fetch(path, { ...init, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Error en la API')
  }
  return data as T
}

export const dashboardApi = {
  listPosts: () => request<{ posts: import('@/lib/types').Post[] }>('/api/dashboard/posts'),
  createPost: (body: import('@/lib/types').PostInput) =>
    request<{ post: import('@/lib/types').Post }>('/api/dashboard/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updatePost: (id: string, body: Partial<import('@/lib/types').PostInput>) =>
    request<{ post: import('@/lib/types').Post }>(`/api/dashboard/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deletePost: (id: string) =>
    request<{ ok: true }>(`/api/dashboard/posts/${id}`, { method: 'DELETE' }),

  listPhotos: () => request<{ photos: import('@/lib/types').PhotoRow[] }>('/api/dashboard/photos'),
  createPhoto: (body: import('@/lib/types').PhotoInput) =>
    request<{ photo: import('@/lib/types').PhotoRow }>('/api/dashboard/photos', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updatePhoto: (id: string, body: Partial<import('@/lib/types').PhotoInput>) =>
    request<{ photo: import('@/lib/types').PhotoRow }>(`/api/dashboard/photos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deletePhoto: (id: string) =>
    request<{ ok: true }>(`/api/dashboard/photos/${id}`, { method: 'DELETE' }),

  signUpload: () =>
    request<{
      cloudName: string
      apiKey: string
      timestamp: number
      folder: string
      signature: string
    }>('/api/dashboard/cloudinary-sign', { method: 'POST', body: '{}' }),
}

export async function uploadToCloudinary (file: File) {
  const sign = await dashboardApi.signUpload()
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', sign.apiKey)
  form.append('timestamp', String(sign.timestamp))
  form.append('signature', sign.signature)
  form.append('folder', sign.folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: 'POST', body: form }
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Error al subir a Cloudinary')
  }
  return {
    public_id: String(data.public_id),
    src: String(data.secure_url ?? data.url),
  }
}
