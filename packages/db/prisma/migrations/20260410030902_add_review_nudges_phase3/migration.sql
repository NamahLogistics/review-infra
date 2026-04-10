-- CreateTable
CREATE TABLE "ReviewNudge" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT NOT NULL,
    "orderRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewNudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewNudge_storeId_status_createdAt_idx" ON "ReviewNudge"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewNudge_customerEmail_createdAt_idx" ON "ReviewNudge"("customerEmail", "createdAt");

-- AddForeignKey
ALTER TABLE "ReviewNudge" ADD CONSTRAINT "ReviewNudge_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewNudge" ADD CONSTRAINT "ReviewNudge_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
