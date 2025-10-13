#!/bin/bash
# Check migration files for common issues

MIGRATIONS_DIR="supabase/migrations"
EXIT_CODE=0

echo "🔍 Checking migration files..."
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Check if there are any migrations
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo "⚠️  No migration files found"
  exit 0
fi

echo "Found $MIGRATION_COUNT migration file(s)"
echo ""

# Check each migration file
for file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$file")

  # Check filename format (should start with timestamp: YYYYMMDD### or YYYYMMDDHHMM)
  if ! [[ $filename =~ ^[0-9]{11,14}_.*\.sql$ ]]; then
    echo "⚠️  $filename: Filename doesn't follow naming convention (timestamp_description.sql)"
    EXIT_CODE=1
  fi

  # Check file is not empty
  if [ ! -s "$file" ]; then
    echo "❌ $filename: File is empty"
    EXIT_CODE=1
  fi

  # Check for common SQL syntax issues
  if grep -q "DROP TABLE" "$file" && ! grep -q "IF EXISTS" "$file"; then
    echo "⚠️  $filename: Contains DROP TABLE without IF EXISTS"
    EXIT_CODE=1
  fi

  # Check that RLS is enabled for new tables
  if grep -q "CREATE TABLE" "$file"; then
    if ! grep -q "alter table.*enable row level security" "$file"; then
      echo "⚠️  $filename: Creates table(s) but may not enable RLS"
      EXIT_CODE=1
    fi
  fi
done

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ All migration checks passed"
else
  echo "⚠️  Some issues found (see above)"
fi

exit $EXIT_CODE
