-- AlterTable
ALTER TABLE "platform_admins" ADD COLUMN     "mfa_otp" VARCHAR(6),
ADD COLUMN     "mfa_otp_expires" TIMESTAMP;
