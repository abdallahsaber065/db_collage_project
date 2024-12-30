export const appConfig = {
  apiBase: import.meta.env.VITE_API_BASE || '/api',
  previewMode: import.meta.env.VITE_PREVIEW_MODE === 'true',
};
