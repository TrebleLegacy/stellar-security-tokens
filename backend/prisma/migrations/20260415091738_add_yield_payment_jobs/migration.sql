-- CreateTable
CREATE TABLE "yield_payment_jobs" (
    "id" TEXT NOT NULL,
    "offer_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "batch_count" INTEGER NOT NULL,
    "total_investors" INTEGER NOT NULL,
    "total_amount" DECIMAL(20,7) NOT NULL,
    "total_fee" DECIMAL(20,7) NOT NULL,
    "tx_hashes" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP,

    CONSTRAINT "yield_payment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "yield_payment_jobs_offer_id_idx" ON "yield_payment_jobs"("offer_id");

-- CreateIndex
CREATE INDEX "yield_payment_jobs_status_idx" ON "yield_payment_jobs"("status");

-- CreateIndex
CREATE INDEX "yield_payment_jobs_company_id_idx" ON "yield_payment_jobs"("company_id");

-- AddForeignKey
ALTER TABLE "yield_payment_jobs" ADD CONSTRAINT "yield_payment_jobs_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
