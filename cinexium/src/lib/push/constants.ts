export const PUSH_BADGE_URL = '/icon-192.png';
export const PUSH_ICON_URL = '/icon-192.png';
export const PUSH_DEFAULT_IMAGE = '/og-image.png';
export const PUSH_HEARTBEAT_MS = 30000;
export const PUSH_ACTIVE_WINDOW_MS = 75000;
export const PUSH_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type PushNotificationKind =
  | 'DIRECT_MESSAGE'
  | 'GROUP_MESSAGE'
  | 'GROUP_MENTION'
  | 'COMMUNITY_MENTION'
  | 'COMMENT_REPLY'
  | 'COMMENT_LIKE'
  | 'FOLLOW'
  | 'COLLECTION_SHARE'
  | 'GROUP_INVITE'
  | 'COMMUNITY_INVITE'
  | 'WATCHLIST_EPISODE_RELEASE'
  | 'WATCHLIST_SEASON_RELEASE'
  | 'WATCHLIST_STREAMING_RELEASE'
  | 'ADMIN_ANNOUNCEMENT'
  | 'MAINTENANCE_ALERT'
  | 'FOLLOW_REQUEST'
  | 'REQUEST_ACCEPTED'
  | 'COMMUNITY_JOIN_REQUEST'
  | 'COMMUNITY_JOIN_ACCEPTED';

export const PUSH_SETTING_FIELDS: Record<PushNotificationKind, string> = {
  DIRECT_MESSAGE: 'directMessagePush',
  GROUP_MESSAGE: 'groupMessagePush',
  GROUP_MENTION: 'groupMessagePush',
  COMMUNITY_MENTION: 'communityMentionPush',
  COMMENT_REPLY: 'commentReplyPush',
  COMMENT_LIKE: 'commentLikePush',
  FOLLOW: 'followPush',
  COLLECTION_SHARE: 'collectionSharePush',
  GROUP_INVITE: 'groupInvitePush',
  COMMUNITY_INVITE: 'communityInvitePush',
  WATCHLIST_EPISODE_RELEASE: 'watchlistReleasePush',
  WATCHLIST_SEASON_RELEASE: 'watchlistReleasePush',
  WATCHLIST_STREAMING_RELEASE: 'watchlistReleasePush',
  ADMIN_ANNOUNCEMENT: 'adminAnnouncementPush',
  MAINTENANCE_ALERT: 'adminAnnouncementPush',
  FOLLOW_REQUEST: 'followPush',
  REQUEST_ACCEPTED: 'followPush',
  COMMUNITY_JOIN_REQUEST: 'communityInvitePush',
  COMMUNITY_JOIN_ACCEPTED: 'communityInvitePush',
};

export const PUSH_TYPE_LABELS: Record<string, string> = {
  DIRECT_MESSAGE: 'Direct Messages',
  GROUP_MESSAGE: 'Group Messages',
  GROUP_MENTION: 'Group Mentions',
  COMMUNITY_MENTION: 'Community Mentions',
  COMMENT_REPLY: 'Comment Replies',
  COMMENT_LIKE: 'Comment Likes',
  FOLLOW: 'Follow Notifications',
  COLLECTION_SHARE: 'Collection Shares',
  GROUP_INVITE: 'Group Invites',
  COMMUNITY_INVITE: 'Community Invites',
  WATCHLIST_EPISODE_RELEASE: 'Watchlist Releases',
  WATCHLIST_SEASON_RELEASE: 'Watchlist Releases',
  WATCHLIST_STREAMING_RELEASE: 'Watchlist Releases',
  ADMIN_ANNOUNCEMENT: 'Admin Announcements',
  MAINTENANCE_ALERT: 'Maintenance Alerts',
  FOLLOW_REQUEST: 'Follow Notifications',
  REQUEST_ACCEPTED: 'Follow Notifications',
  COMMUNITY_JOIN_REQUEST: 'Community Invites',
  COMMUNITY_JOIN_ACCEPTED: 'Community Invites',
};

export type PresencePageType =
  | 'chat'
  | 'group'
  | 'community'
  | 'comment'
  | 'movie'
  | 'series'
  | 'collection'
  | 'notifications'
  | 'other';
