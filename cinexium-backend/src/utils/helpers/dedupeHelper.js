export const dedupeMedia = (items) => {
  const map = new Map();

  for (const item of items) {
    map.set(`${item.mediaType}_${item.mediaId}`, item);
  }
  return Array.from(map.values());
};
