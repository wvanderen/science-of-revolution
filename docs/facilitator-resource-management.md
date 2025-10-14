# Facilitator Resource Management

This document describes the facilitator capabilities for managing reading resources in the Science of Revolution library.

## Features

### Edit Resources
Facilitators can edit existing resources by:
1. Hovering over a resource card in the library
2. Clicking the edit (pencil) icon that appears
3. Updating any of the following fields:
   - Title (required)
   - Author
   - Source URL
   - Sequence Order (for sorting)
   - Resource Type (document, audio, video)
4. Saving changes

### Delete Resources
Facilitators can delete resources by:
1. Hovering over a resource card in the library
2. Clicking the delete (trash) icon that appears
3. Confirming the deletion in the modal dialog
4. The system will:
   - Delete all associated sections
   - Remove the file from storage
   - Remove the resource record from the database

## UI Implementation

### Resource Card Enhancements
- Edit and delete buttons appear on hover for facilitators only
- Buttons are positioned in the top-right corner of each card
- Icons are intuitive and accessible with tooltips
- Buttons don't interfere with the card's primary navigation

### Edit Modal
- Full-featured form for updating resource metadata
- Pre-populated with current resource data
- Validation for required fields
- Loading states during save operations
- Success/error feedback via toast notifications

### Delete Confirmation
- Warning modal explaining the consequences
- Clear indication that deletion is permanent
- Lists what will be deleted (resource + sections + file)
- Confirmation required before proceeding

## Technical Implementation

### Hooks
- `useUpdateResource`: Handles resource updates with optimistic UI updates
- `useDeleteResource`: Handles cascading deletion (sections → storage file → resource)

### Database Operations
- Updates use standard Supabase `update()` operations
- Deletions cascade through dependencies in proper order
- Storage cleanup happens after database operations
- Query cache invalidation ensures UI stays in sync

### Permissions
- All operations check for facilitator permissions
- Non-facilitators cannot see or access edit/delete functionality
- Role-based access control enforced at component level

## Error Handling

- Network errors show user-friendly messages
- Storage deletion failures are logged but don't block resource deletion
- Validation errors prevent invalid data submission
- Toast notifications provide clear feedback on operation results

## Document Content Editing

Facilitators can now edit the actual content of documents directly from the reader interface:

### Accessing Document Editor
1. Navigate to any document in the reader
2. Click the edit (pencil) icon in the toolbar (facilitators only)
3. The document editor modal will open

### Editor Features
- **Section Management**: Add, remove, reorder, and rename sections
- **Markdown Editing**: Edit content in raw markdown format
- **Live Preview**: Toggle between edit and preview modes
- **Word Count**: Real-time word count for each section
- **Auto-save**: Manual save with confirmation

### Section Operations
- **Add Section**: Create new sections with default template
- **Remove Section**: Delete sections (minimum 1 section required)
- **Reorder**: Drag sections or use up/down arrows to reorder
- **Rename**: Click section titles to rename inline

### Content Editing
- Full markdown support including headers, lists, emphasis, etc.
- Preview mode shows rendered content
- Changes are applied to all readers immediately after save
- Automatic word count calculation

### Data Persistence
- Updates existing sections in database
- Creates new sections when added
- Removes deleted sections from database
- Updates word counts automatically
- Invalidates cache to refresh reader content

## Future Enhancements

Potential improvements for resource management:
- Bulk operations (select multiple resources)
- Resource duplication
- More granular permissions (content editors vs full admins)
- Resource versioning/history
- Export/import functionality for resource metadata
- Document collaboration with multiple editors
- Rich text editor option alongside markdown
- Section templates and content snippets