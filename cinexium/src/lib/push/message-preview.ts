type StructuredMessage = {
  kind: string;
  meta: Record<string, any>;
};

export function parseStructuredMessage(content: string | null | undefined): StructuredMessage | null {
  if (!content) {
    return null;
  }

  const match = content.match(/^\[([A-Z_]+)\]:([\s\S]+)$/);
  if (!match) {
    return null;
  }

  try {
    return {
      kind: match[1],
      meta: JSON.parse(match[2]) as Record<string, any>,
    };
  } catch {
    return null;
  }
}

export function getStructuredMessagePreview(structured: StructuredMessage | null | undefined): string | null {
  if (!structured) {
    return null;
  }

  if (structured.kind === 'GROUP_INVITE') {
    return structured.meta?.isCommunity ? 'Shared a community' : 'Shared a group';
  }

  if (structured.kind === 'COLLECTION_SHARE') {
    const creatorUsername = String(structured.meta?.creatorUsername || '').toLowerCase();
    if (creatorUsername === 'cinexium:movie') {
      return 'Shared a movie';
    }
    if (creatorUsername === 'cinexium:tv' || creatorUsername === 'cinexium:series') {
      return 'Shared a series';
    }
    return 'Shared a collection';
  }

  return null;
}

export function getMessagePreview(params: {
  content?: string | null;
  gifUrl?: string | null;
  structured?: StructuredMessage | null;
}): string {
  const structuredPreview = getStructuredMessagePreview(params.structured);
  if (structuredPreview) {
    return structuredPreview;
  }

  const trimmedContent = typeof params.content === 'string' ? params.content.trim() : '';
  if (trimmedContent) {
    return trimmedContent;
  }

  if (params.gifUrl) {
    return 'Sent a GIF';
  }

  return 'Sent a message';
}

export function sanitizeNotificationText(value: string | null | undefined): string {
  const input = String(value || '');
  return input
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\u200D\uFE0F]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
