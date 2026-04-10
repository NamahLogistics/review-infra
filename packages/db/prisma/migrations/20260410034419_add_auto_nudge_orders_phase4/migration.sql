-- AlterTable
ALTER TABLE "ReviewNudge" ADD COLUMN     "sendAfter" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReviewOrder" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT NOT NULL,
    "orderRef" TEXT,
    "nudgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewOrder_storeId_createdAt_idx" ON "ReviewOrder"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewOrder_storeId_customerEmail_createdAt_idx" ON "ReviewOrder"("storeId", "customerEmail", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewOrder_storeId_externalOrderId_productId_key" ON "ReviewOrder"("storeId", "externalOrderId", "productId");

-- CreateIndex
CREATE INDEX "ReviewNudge_storeId_status_sendAfter_idx" ON "ReviewNudge"("storeId", "status", "sendAfter");

-- AddForeignKey
ALTER TABLE "ReviewOrder" ADD CONSTRAINT "ReviewOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewOrder" ADD CONSTRAINT "ReviewOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
