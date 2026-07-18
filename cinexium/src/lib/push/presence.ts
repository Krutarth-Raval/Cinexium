import type { PresencePageType } from './constants';

export function getPageContext(pathname: string) {
  if (pathname.startsWith('/chat/group/')) {
    const id = pathname.split('/')[3] || '';
    return {
      pageType: pathname.includes('/chat/group/') ? 'group' as PresencePageType : 'other' as PresencePageType,
      pageTargetId: id,
    };
  }

  if (pathname.startsWith('/chat/')) {
    return {
      pageType: 'chat' as PresencePageType,
      pageTargetId: pathname.split('/')[2] || '',
    };
  }

  if (pathname.startsWith('/movie/')) {
    return { pageType: 'movie' as PresencePageType, pageTargetId: pathname.split('/')[2] || '' };
  }

  if (pathname.startsWith('/series/')) {
    return { pageType: 'series' as PresencePageType, pageTargetId: pathname.split('/')[2] || '' };
  }

  if (pathname.startsWith('/collection/')) {
    return { pageType: 'collection' as PresencePageType, pageTargetId: pathname.split('/')[2] || '' };
  }

  if (pathname.startsWith('/notifications')) {
    return { pageType: 'notifications' as PresencePageType, pageTargetId: '' };
  }

  return { pageType: 'other' as PresencePageType, pageTargetId: '' };
}

export function isForegroundVisible(visibilityState: DocumentVisibilityState) {
  return visibilityState === 'visible' && document.hasFocus();
}
