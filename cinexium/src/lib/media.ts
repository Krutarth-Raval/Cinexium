export function normalizeMediaTypeForRoute(mediaType?: string | null) {
  return mediaType === 'tv' ? 'series' : mediaType || 'movie';
}

export function getMediaDetailHref(mediaType: string | null | undefined, mediaId: string | number) {
  return `/${normalizeMediaTypeForRoute(mediaType)}/${mediaId}`;
}

export function normalizeMediaDetailPath(path?: string | null) {
  if (!path) return path || '';
  return path.startsWith('/tv/') ? path.replace('/tv/', '/series/') : path;
}
