-- Add content field to resource_sections for storing raw markdown
-- This allows editing content while keeping content_html for display

ALTER TABLE resource_sections
ADD COLUMN content TEXT;

-- Create an index on the content field for better search performance if needed
-- CREATE INDEX idx_resource_sections_content ON resource_sections USING gin(to_tsvector('english', content));

-- Comment: The content field will store raw markdown content
-- while content_html continues to store the processed HTML for display