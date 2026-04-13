-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "connectionStatus" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "shopifyConnectedAt" TIMESTAMP(3),
ADD COLUMN     "shopifyUninstalledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Store_userId_connectionStatus_createdAt_idx" ON "Store"("userId", "connectionStatus", "createdAt");
