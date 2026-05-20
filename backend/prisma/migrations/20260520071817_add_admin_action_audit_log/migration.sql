-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "actor_id" INTEGER,
    "actor_type" VARCHAR(50),
    "actor_role" VARCHAR(50),
    "action" VARCHAR(255) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(255),
    "payload_hash" VARCHAR(64),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "result" VARCHAR(20) NOT NULL,
    "status_code" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_actions_actor_id_created_at_idx" ON "admin_actions"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_actions_action_created_at_idx" ON "admin_actions"("action", "created_at");

-- CreateIndex
CREATE INDEX "admin_actions_target_type_target_id_created_at_idx" ON "admin_actions"("target_type", "target_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_actions_created_at_idx" ON "admin_actions"("created_at");
