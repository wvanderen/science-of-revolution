# Seed Data Structure

## Overview
This document describes the structure for seeding reading resources into the Science of Revolution application. Resources are Marxist texts split into logical sections for granular reading and highlighting.

## Database Tables

### resources
Top-level reading materials (books, pamphlets, essays)

```sql
{
  id: uuid (generated),
  title: text,                    -- e.g., "Manifesto of the Communist Party"
  author: text,                   -- e.g., "Karl Marx and Friedrich Engels"
  type: text,                     -- 'document' (default), 'video', 'audio'
  source_url: text,               -- Original source URL for attribution
  storage_path: text,             -- Path in Supabase storage (for future use)
  sequence_order: integer,        -- Display order in library (1, 2, 3...)
  created_at: timestamptz,
  updated_at: timestamptz
}
```

### resource_sections
Logical divisions within a resource (chapters, sections, parts)

```sql
{
  id: uuid (generated),
  resource_id: uuid,              -- FK to resources
  title: text,                    -- e.g., "I. Bourgeois and Proletarians"
  order: integer,                 -- Section sequence (0, 1, 2...)
  content_html: text,             -- HTML content of the section
  word_count: integer,            -- For reading time estimates
  created_at: timestamptz,
  updated_at: timestamptz
}
```

## Content Guidelines

### HTML Content Format
Content should be well-formatted HTML with semantic tags:

```html
<p>Standard paragraphs for body text.</p>

<p><strong>Bold text</strong> for emphasis on key concepts.</p>

<p><em>Italic text</em> for terminology or foreign words.</p>

<blockquote>
  <p>Use blockquotes for quotations.</p>
</blockquote>

<ul>
  <li>Unordered lists for bullet points</li>
  <li>Second item</li>
</ul>

<ol>
  <li>Ordered lists for sequential items</li>
  <li>Second item</li>
</ol>
```

### Section Division Strategy

**Good section boundaries:**
- Natural chapter/part divisions in the original text
- Major topic shifts
- Length: 300-800 words per section (2-4 minute read)
- Clear, descriptive titles

**Example from Communist Manifesto:**
```
Section 1: "I. Bourgeois and Proletarians" (650 words)
Section 2: "II. Proletarians and Communists" (530 words)
Section 3: "IV. Position of the Communists" (280 words)
```

### Word Count Calculation
Count all visible text, excluding HTML tags:
```javascript
const wordCount = content_html
  .replace(/<[^>]*>/g, ' ')
  .trim()
  .split(/\s+/)
  .length;
```

## Adding New Resources

### Method 1: SQL (Manual)
```sql
do $$
declare
  resource_id uuid;
begin
  -- 1. Create resource
  insert into public.resources (title, author, type, source_url, storage_path, sequence_order)
  values (
    'Your Resource Title',
    'Author Name',
    'document',
    'https://source-url.com',
    '/resources/filename.html',
    4  -- Next sequence number
  )
  returning id into resource_id;

  -- 2. Add sections
  insert into public.resource_sections (resource_id, title, "order", content_html, word_count)
  values
    (resource_id, 'Section 1 Title', 0, '<p>Content here...</p>', 450),
    (resource_id, 'Section 2 Title', 1, '<p>More content...</p>', 380);

  raise notice 'Resource added with ID: %', resource_id;
end $$;
```

### Method 2: Application API (Future)
```typescript
// Using the useIngestResource hook
import { useIngestResource } from '@/features/library/hooks/useIngestResource';

const { mutate: ingestResource } = useIngestResource();

ingestResource({
  resource: {
    title: 'Your Resource Title',
    author: 'Author Name',
    type: 'document',
    source_url: 'https://source-url.com',
    storage_path: '/resources/filename.html',
    sequence_order: 4
  },
  content: markdownOrHtmlContent,
  format: 'markdown' // or 'html' or 'auto'
});
```

## Current Seed Data

### Included Resources
1. **Manifesto of the Communist Party** (Marx & Engels)
   - 3 sections, ~1,460 words total
   - Classic introduction to communist theory

2. **Wage Labour and Capital** (Marx)
   - 2 sections, ~780 words total
   - Explanation of capitalist wage relations

3. **Principles of Communism** (Engels)
   - 2 sections, ~500 words total
   - Q&A format introducing communism

### Running Seed Scripts
```bash
# From Supabase CLI
supabase db reset  # Resets and runs all migrations + seed.sql

# Or manually:
psql $DATABASE_URL -f supabase/seed-resources.sql
```

## Content Sources

### Marxists Internet Archive
- URL: https://www.marxists.org/
- License: Public domain classics
- Format: HTML (needs cleaning)
- Attribution: Required in source_url field

### Science of Revolution Curriculum
- URL: https://communistusa.org/education/
- Curated reading list for study groups
- Recommended sequence for political education

## Best Practices

### Content Preparation
1. **Source from Marxists.org** for accuracy
2. **Clean HTML**: Remove navigation, ads, styling
3. **Preserve formatting**: Keep paragraphs, emphasis, lists
4. **Add attribution**: Always include source_url
5. **Test rendering**: View in reader before committing

### Section Sizing
- **Too short** (< 200 words): Consider merging
- **Ideal** (300-800 words): Good reading session
- **Too long** (> 1000 words): Consider splitting

### Quality Checks
- [ ] All HTML is well-formed (no unclosed tags)
- [ ] Word counts are accurate
- [ ] Sections are in correct order (0, 1, 2...)
- [ ] sequence_order is unique across resources
- [ ] source_url points to original text
- [ ] Title and author are accurate

## Future Enhancements

### Planned Features
- **Facilitator upload UI**: Web-based resource submission
- **Auto-sectioning**: ML-based content splitting
- **Format conversion**: PDF → HTML ingestion
- **Metadata enrichment**: Tags, difficulty, prerequisites
- **Version control**: Track content updates over time

### Data Additions Needed
- Cover images for resources
- Reading prerequisites (resource dependencies)
- Tags/categories (theory, history, economics)
- Difficulty ratings (beginner, intermediate, advanced)
- Estimated completion time per resource

## Troubleshooting

### Common Issues

**Sections not displaying:**
- Check that resource_id matches an existing resource
- Verify order is sequential (0, 1, 2...)
- Ensure content_html is not null

**Word count incorrect:**
- Recalculate excluding HTML tags
- Update word_count column manually if needed

**Highlighting broken:**
- Verify HTML is well-formed
- Avoid nested formatting that might confuse text selection
- Test with sample highlights in development

**RLS policy errors:**
- Ensure user is authenticated
- Check that cohort relationships exist for 'cohort' visibility
- Verify facilitator role for protected operations

## Examples

See `supabase/seed-resources.sql` for complete working examples of all three current resources with properly formatted sections.
