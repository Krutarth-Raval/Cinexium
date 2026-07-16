export interface GifSelection {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_width: { url: string; width: string; height: string; webp?: string };
    fixed_width_still: { url: string };
    fixed_width_downsampled?: { url: string; webp?: string };
    downsized_medium?: { url: string };
    original?: { width: string; height: string };
  };
}

export interface GiphyResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

export const GIPHY_PAGE_SIZE = 20;

export const getGifRenderUrl = (gif: GiphyGif) =>
  gif.images.downsized_medium?.url || gif.images.fixed_width.url;

export const getGifPreviewUrl = (gif: GiphyGif) =>
  gif.images.fixed_width_downsampled?.webp ||
  gif.images.fixed_width_downsampled?.url ||
  gif.images.fixed_width.webp ||
  gif.images.fixed_width.url;

export const getGifStillUrl = (gif: GiphyGif) => gif.images.fixed_width_still.url;

export const getGifDimensions = (gif: GiphyGif) => {
  const width = Number(gif.images.original?.width || gif.images.fixed_width.width);
  const height = Number(gif.images.original?.height || gif.images.fixed_width.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
};
