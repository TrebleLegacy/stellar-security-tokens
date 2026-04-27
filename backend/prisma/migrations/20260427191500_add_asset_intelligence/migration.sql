-- Phase 2: Asset Intelligence
-- Yield decomposition (informational)
ALTER TABLE "offers" ADD COLUMN "rental_yield_rate" DECIMAL(10,7);
ALTER TABLE "offers" ADD COLUMN "value_growth_rate" DECIMAL(10,7);

-- Location
ALTER TABLE "offers" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "offers" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "offers" ADD COLUMN "location_address" VARCHAR(500);

-- Structured property metadata
ALTER TABLE "offers" ADD COLUMN "asset_metadata" JSONB DEFAULT '{}';
