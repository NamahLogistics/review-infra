-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "ipHash" TEXT;

-- AlterTable
ALTER TABLE "ReviewNudge" ADD COLUMN     "clickedAt" TIMESTAMP(3),
ADD COLUMN     "lastResendAt" TIMESTAMP(3),
ADD COLUMN     "openedAt" TIMESTAMP(3),
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "reviewId" TEXT,
    "nudgeId" TEXT,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewEvent_storeId_createdAt_idx" ON "ReviewEvent"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_type_createdAt_idx" ON "ReviewEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Review_storeId_authorEmail_createdAt_idx" ON "Review"("storeId", "authorEmail", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
