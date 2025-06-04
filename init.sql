-- Initialize the database with proper extensions and settings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by Sequelize, but good to have as backup)
-- Note: Sequelize will handle table creation, this is just for any additional setup
