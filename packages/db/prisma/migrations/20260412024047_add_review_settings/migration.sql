-- DropIndex
DROP INDEX "Store_userId_connectionStatus_createdAt_idx";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "autoReviewEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxReminders" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "sendAfterDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "shopifyAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "shopifyRefreshToken" TEXT,
ADD COLUMN     "shopifyRefreshTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReviewSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nudgingLevel" TEXT NOT NULL DEFAULT 'medium',
    "sendDelayDays" INTEGER NOT NULL DEFAULT 3,
    "followUpDelayDays" INTEGER NOT NULL DEFAULT 2,
    "maxReminders" INTEGER NOT NULL DEFAULT 1,
    "emailSubject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSettings_storeId_key" ON "ReviewSettings"("storeId");

-- AddForeignKey
ALTER TABLE "ReviewSettings" ADD CONSTRAINT "ReviewSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
