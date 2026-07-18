-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "body" TEXT,
ADD COLUMN     "deepLink" TEXT,
ADD COLUMN     "eventKey" TEXT,
ADD COLUMN     "handledAt" TIMESTAMP(3),
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminAnnouncementPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "collectionSharePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "commentLikePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "commentReplyPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "communityInvitePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "communityMentionPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "directMessagePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "followPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "groupInvitePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "groupMessagePush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "watchlistReleasePush" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PushDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "browser" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permission" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresenceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "pageType" TEXT,
    "pageTargetId" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "isFocused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresenceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushDevice_token_key" ON "PushDevice"("token");

-- CreateIndex
CREATE INDEX "PushDevice_userId_isActive_idx" ON "PushDevice"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PushDevice_userId_deviceId_token_key" ON "PushDevice"("userId", "deviceId", "token");

-- CreateIndex
CREATE INDEX "PresenceSession_userId_lastSeenAt_idx" ON "PresenceSession"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "PresenceSession_userId_deviceId_key" ON "PresenceSession"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");

-- AddForeignKey
ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresenceSession" ADD CONSTRAINT "PresenceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
