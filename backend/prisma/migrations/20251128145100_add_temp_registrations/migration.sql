-- CreateTable
CREATE TABLE "temp_registrations" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_expiry" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP NOT NULL,

    CONSTRAINT "temp_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temp_registrations_email_key" ON "temp_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "temp_registrations_document_key" ON "temp_registrations"("document");

-- CreateIndex
CREATE UNIQUE INDEX "temp_registrations_verification_token_key" ON "temp_registrations"("verification_token");

-- CreateIndex
CREATE INDEX "temp_registrations_email_idx" ON "temp_registrations"("email");

-- CreateIndex
CREATE INDEX "temp_registrations_verification_token_idx" ON "temp_registrations"("verification_token");

-- CreateIndex
CREATE INDEX "temp_registrations_expires_at_idx" ON "temp_registrations"("expires_at");
