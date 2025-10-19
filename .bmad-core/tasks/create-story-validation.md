# Create Story Validation Test Task

## Overview
Generate a browser-based validation test that verifies the acceptance criteria of a specific story are working correctly in the running application.

## Prerequisites
- Story file exists with clear acceptance criteria
- Development server is running
- Test environment is configured

## Steps

### 1. Parse Story File
Read the story file and extract:
- Story number and title
- Story description (As a/I want/so that format)
- Acceptance criteria (numbered list)
- Integration verification points
- Test data requirements

### 2. Generate Test Structure
Create test file using the template:
```bash
tests/e2e/story-validation-{STORY_NUMBER}.spec.ts
```

### 3. Map Acceptance Criteria to Tests

For each acceptance criterion:
1. **Extract the requirement**: What should the system do?
2. **Identify testable behavior**: How can we verify this with browser automation?
3. **Create specific test**: Use Playwright to interact with the application
4. **Add assertions**: Verify the expected behavior

#### Common AC Patterns:
- **UI Components**: Test element existence and behavior
- **Data Flow**: Test that data flows correctly between components
- **API Integration**: Test that API calls work and data is displayed
- **State Changes**: Test that application state changes correctly
- **User Interactions**: Test that user actions produce expected results

### 4. Implement Browser Validation

#### Element Testing
```typescript
// Test for component existence
const component = await page.locator('[data-testid="component-name"]')
await expect(component).toBeVisible()

// Test for behavior
await component.click()
const result = await page.locator('[data-testid="result"]')
await expect(result).toContainText('expected text')
```

#### Functional Testing
```typescript
// Test user flows
await page.goto('/relevant-page')
await page.fill('[data-testid="input"]', 'test value')
await page.click('[data-testid="submit"]')
await expect(page.locator('[data-testid="success"]')).toBeVisible()
```

#### State Testing
```typescript
// Test state changes
const initialState = await page.evaluate(() => /* get state */)
await page.click('[data-testid="action"]')
const finalState = await page.evaluate(() => /* get state */)
expect(finalState).not.toEqual(initialState)
```

#### Error Testing
```typescript
// Test error handling
const errors: string[] = []
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text())
})

// Trigger potential error
await page.click('[data-testid="potentially-broken-action"]')

// Verify no unexpected errors
expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0)
```

### 5. Add Integration Verification Tests

For each integration verification point:
1. **Identify the integration**: What systems/components need to work together?
2. **Create scenario**: Set up conditions that test the integration
3. **Verify behavior**: Ensure integration works as expected
4. **Test edge cases**: Include failure scenarios and recovery

### 6. Include Performance and Reliability

#### Performance Checks
```typescript
const startTime = Date.now()
await page.goto('/page-to-test')
const loadTime = Date.now() - startTime
expect(loadTime).toBeLessThan(5000) // 5 seconds
```

#### Memory Monitoring
```typescript
const initialMemory = await page.evaluate(() =>
  (performance as any).memory?.usedJSHeapSize || 0
)
// Perform operations
const finalMemory = await page.evaluate(() =>
  (performance as any).memory?.usedJSHeapSize || 0
)
const memoryGrowth = finalMemory - initialMemory
expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB
```

### 7. Add Comprehensive Validation

Create a final test that:
- Monitors for all types of errors
- Performs multiple interactions
- Tests the complete user journey
- Validates the application remains functional

### 8. Test the Generated Test

Run the generated test to ensure:
- Test actually works
- All assertions pass
- Test covers the requirements adequately
- No flaky behavior

## Template Variables

When using the story validation template, replace these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{STORY_NUMBER}}` | Story identifier | `1.2` |
| `{{STORY_TITLE}}` | Story title | `Reader Progress Component Extraction` |
| `{{STORY_DESCRIPTION}}` | Full story description | `As a developer...` |
| `{{TEST_DATA}}` | Test-specific data setup | `const testId = 'test-123'` |
| `{{BEFORE_EACH_SETUP}}` | Test preparation code | `await page.goto('/test-page')` |
| `{{ACCEPTANCE_CRITERIA_TESTS}}` | Tests for each AC | Individual test functions |
| `{{INTEGRATION_VERIFICATION_TESTS}}` | IV validation tests | Integration test functions |
| `{{OVERALL_TEST_SETUP}}` | Comprehensive test setup | Page navigation and monitoring |
| `{{OVERALL_TEST_INTERACTIONS}}` | Multiple user interactions | Scroll, click, fill, etc. |

## Best Practices

### Test Design
1. **Focus on User Experience**: Test what users actually experience
2. **Use Stable Selectors**: Prefer data-testid over CSS classes
3. **Wait for Stability**: Use proper wait conditions
4. **Test Scenarios, Not Implementation**: Verify outcomes, not internal details

### Error Handling
1. **Monitor All Error Types**: Console, pageerror, network failures
2. **Filter Appropriately**: Distinguish warnings from critical errors
3. **Provide Context**: Include error details in test failures

### Performance
1. **Set Realistic Thresholds**: Based on application requirements
2. **Monitor Memory**: Detect potential memory leaks
3. **Test Load Times**: Ensure acceptable performance

### Maintenance
1. **Update with Story Changes**: Keep tests in sync with story updates
2. **Handle Flaky Tests**: Add proper waits and retries
3. **Document Complex Scenarios**: Explain non-obvious test logic

## Exit Criteria

- Test file created for the story
- All acceptance criteria have corresponding tests
- Integration verification points are tested
- Test runs successfully and validates requirements
- Test follows established patterns and conventions
- Documentation is clear for future maintenance

## Quality Checklist

- [ ] Story file parsed correctly
- [ ] All acceptance criteria mapped to tests
- [ ] Integration verification points tested
- [ ] Error monitoring implemented
- [ ] Performance checks included where relevant
- [ ] Test runs reliably without flakiness
- [ ] Test file follows naming conventions
- [ ] Proper cleanup implemented
- [ ] Documentation is clear and complete