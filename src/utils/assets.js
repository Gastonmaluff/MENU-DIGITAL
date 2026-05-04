export const resolveAssetUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('/assets/')) return url;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${url}`;
};
