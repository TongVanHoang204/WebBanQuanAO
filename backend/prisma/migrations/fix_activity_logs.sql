-- Fix #5: Upgrade activity_logs for millisecond precision + wider user_agent + entity_type index
ALTER TABLE `activity_logs` MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `activity_logs` MODIFY COLUMN `user_agent` VARCHAR(500) NULL;
CREATE INDEX `idx_logs_entity_type` ON `activity_logs` (`entity_type`);
