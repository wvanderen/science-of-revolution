#!/bin/bash
# Create a new migration file with timestamp

if [ -z "$1" ]; then
  echo "Usage: npm run migration:create <migration_name>"
  echo "Example: npm run migration:create add_highlights_table"
  exit 1
fi

MIGRATION_NAME=$1
TIMESTAMP=$(date +"%Y%m%d%H%M")
FILENAME="${TIMESTAMP}_${MIGRATION_NAME}.sql"
FILEPATH="supabase/migrations/${FILENAME}"

# Create the migration file with a template
cat > "$FILEPATH" << EOF
-- Migration: ${MIGRATION_NAME}
-- Created: $(date +"%Y-%m-%d %H:%M:%S")
-- Description: [Add description here]

-- Add your SQL migration here
-- Remember to:
-- 1. Include rollback instructions as comments if complex
-- 2. Test locally before committing
-- 3. Consider RLS policies for new tables

EOF

echo "✓ Created migration: ${FILEPATH}"
echo ""
echo "Next steps:"
echo "1. Edit the migration file and add your SQL"
echo "2. Test locally: npm run migration:up"
echo "3. Commit the migration file to version control"
