DROP INDEX IF EXISTS "Application_landId_farmerId_status_key";

CREATE INDEX IF NOT EXISTS "Application_landId_farmerId_idx"
ON "Application"("landId", "farmerId");
