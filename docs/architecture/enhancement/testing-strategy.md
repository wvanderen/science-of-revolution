# Testing Strategy

## Integration with Existing Tests

**Existing Test Framework:** Vitest for unit testing, Playwright for E2E testing, React Testing Library for component testing
**Test Organization:** Feature-based test organization, comprehensive coverage expectations
**Coverage Requirements:** Maintain or improve existing test coverage (>90% for critical paths)

## New Testing Requirements

### Unit Tests for New Components

- **Framework:** Vitest with React Testing Library
- **Location:** `tests/features/reader/` matching source structure
- **Coverage Target:** 100% for new components, maintaining existing coverage
- **Integration with Existing:** Use existing test utilities and patterns

### Integration Tests

- **Scope:** Complete reader flows with new component architecture
- **Existing System Verification:** Ensure all existing functionality works with new structure
- **New Feature Testing:** Test new component interactions and state management

### E2E Tests

**Critical Flows to Test:**
1. **Reading Experience:** Load document, navigate sections, scroll behavior
2. **Progress Tracking:** Automatic progress updates, completion detection
3. **Highlighting:** Create highlights, change colors, add notes
4. **Keyboard Shortcuts:** All existing keyboard shortcuts functionality
5. **Responsive Design:** Mobile and desktop layouts
6. **Collaborative Features:** Real-time highlights and notes
