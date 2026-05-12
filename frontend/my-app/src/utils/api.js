export function getApiUrl(path) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}