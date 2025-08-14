-- Migration: Create versioned checkpoints table
-- Description: Creates a table to store workflow checkpoints with versioning support

CREATE TABLE IF NOT EXISTS checkpoints (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    nodes JSON NOT NULL DEFAULT '[]',
    edges JSON NOT NULL DEFAULT '[]',
    viewport JSON NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    metadata JSON DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    parent_checkpoint_id VARCHAR(36),
    
    -- Create indexes for better query performance
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_created_at (created_at),
    INDEX idx_version (workflow_id, version_number),
    INDEX idx_active (workflow_id, is_active),
    
    -- Foreign key constraints (adjust based on your actual schema)
    -- FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    -- FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    -- FOREIGN KEY (parent_checkpoint_id) REFERENCES checkpoints(id) ON DELETE SET NULL
);

-- Create a view for the latest checkpoint versions per workflow
CREATE OR REPLACE VIEW latest_checkpoints AS
SELECT c1.*
FROM checkpoints c1
INNER JOIN (
    SELECT workflow_id, MAX(version_number) as max_version
    FROM checkpoints 
    WHERE is_active = true
    GROUP BY workflow_id
) c2 ON c1.workflow_id = c2.workflow_id AND c1.version_number = c2.max_version
WHERE c1.is_active = true;

-- Create trigger to auto-increment version numbers
DELIMITER $$
CREATE TRIGGER before_checkpoint_insert 
BEFORE INSERT ON checkpoints
FOR EACH ROW
BEGIN
    DECLARE max_version INT DEFAULT 0;
    
    SELECT COALESCE(MAX(version_number), 0) INTO max_version 
    FROM checkpoints 
    WHERE workflow_id = NEW.workflow_id AND is_active = true;
    
    SET NEW.version_number = max_version + 1;
    
    -- Generate UUID if not provided
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$
DELIMITER ;
