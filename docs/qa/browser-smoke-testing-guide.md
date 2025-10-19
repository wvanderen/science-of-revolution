# Browser Smoke Testing Guide

## Overview

Browser smoke testing provides rapid validation of core application functionality across different browsers and devices. This guide outlines the procedures, best practices, and integration points for smoke testing in the QA workflow.

## When to Run Smoke Tests

### Mandatory Gates
- **Pre-merge**: Before merging any PR to main
- **Pre-release**: Before creating any release tags
- **Post-deployment**: After deploying to staging/production
- **Infrastructure changes**: After any server or dependency updates

### Optional Gates
- **Daily builds**: Automated daily smoke test execution
- **Feature branches**: Before feature branch reviews
- **Performance monitoring**: Regular performance regression checks

## Smoke Test Coverage Areas

### 1. Core Application Functionality
- Application loads without critical errors
- Authentication flows work
- Navigation between pages functions
- Form submissions work correctly

### 2. Performance Metrics
- Page load time < 5 seconds
- First Contentful Paint < 2 seconds
- DOM Interactive < 3 seconds
- Memory usage stable

### 3. Cross-Browser Compatibility
- Desktop Chrome (primary)
- Mobile Chrome responsiveness
- Basic functionality across viewports

### 4. Error Handling
- Invalid routes handled gracefully
- Network interruptions managed
- Form validation works
- No unhandled JavaScript errors

### 5. Accessibility Basics
- Proper heading hierarchy
- Form labels present
- Keyboard navigation works
- ARIA labels where appropriate

## Commands Reference

### Local Development
```bash
# Run all smoke tests
npm run test:smoke

# Run mobile-specific smoke tests
npm run test:smoke:mobile

# Run story validation tests
npm run test:story

# Run with detailed output
npm run test:smoke -- --reporter=list

# Run specific test file
npx playwright test tests/e2e/browser-smoke.spec.ts

# Run specific story validation
npx playwright test tests/e2e/story-validation-1.2.spec.ts
```

### CI/CD Integration
```bash
# CI-friendly smoke tests with JSON output
npm run test:smoke:ci

# CI-friendly story validation tests
npm run test:story:ci

# Results saved to test-results/smoke-results.json
```

### Debugging Smoke Tests
```bash
# Run with UI mode for debugging
npx playwright test --config=playwright.smoke.config.ts --ui

# Run with trace for detailed debugging
npx playwright test --config=playwright.smoke.config.ts --trace on

# Run with headed mode (visible browser)
npx playwright test --config=playwright.smoke.config.ts --headed
```

## Story Requirement Validation

### Overview
Story validation tests go beyond general smoke testing by specifically verifying that individual story acceptance criteria are working correctly in the browser.

### When to Use Story Validation
- **Story Completion**: Validate that story requirements are actually working
- **PR Review**: Ensure implemented features meet story criteria
- **Regression Testing**: Verify story functionality still works after changes
- **Integration Testing**: Validate story integrations with other features

### Creating Story Validation Tests

#### 1. Generate from Story
Use the create-story-validation task:
```
*task create-story-validation
```

#### 2. Map Acceptance Criteria
For each acceptance criterion in the story:
- Create a specific browser test
- Test the actual user behavior
- Verify expected outcomes
- Include error scenarios

#### 3. Test Structure
Story validation tests should include:
- **AC Tests**: Individual tests for each acceptance criterion
- **Integration Tests**: Tests for integration verification points
- **User Journey Tests**: End-to-end validation of complete workflows
- **Error Handling**: Validation of error scenarios and edge cases

### Running Story Validation Tests

#### Individual Story
```bash
# Test specific story
npx playwright test tests/e2e/story-validation-{STORY_NUMBER}.spec.ts

# Run with UI for debugging
npx playwright test tests/e2e/story-validation-{STORY_NUMBER}.spec.ts --ui
```

#### All Story Validations
```bash
# Run all story validation tests
npm run test:story

# CI-friendly with JSON output
npm run test:story:ci
```

### Story Validation Best Practices

#### Test Design
- **Focus on Requirements**: Test exactly what the story specifies
- **User-Centric**: Test from user perspective, not implementation details
- **Comprehensive Coverage**: Test positive, negative, and edge cases
- **Realistic Scenarios**: Use realistic test data and conditions

#### Error Monitoring
```typescript
// Monitor for story-specific errors
const storyErrors: string[] = []
page.on('console', msg => {
  if (msg.type() === 'error' &&
      msg.text().includes('story-specific-context')) {
    storyErrors.push(msg.text())
  }
})
```

#### Requirement Tracing
```typescript
// Document which AC each test validates
test('AC1: User can create new resource', async ({ page }) => {
  // Test implementation
  // This test validates: "User can create new resources with valid data"
})
```

## Integration with QA Workflow

### 1. Pre-Merge Validation
Add smoke testing to your PR validation:
```bash
# In CI pipeline
npm run ci  # Includes smoke tests
```

### 2. Story Gate Process
For story-specific validation:
```bash
# Run story validation tests
npm run test:story

# Execute story gate with Quinn
*gate {story} browser-smoke
```

### 3. Results Analysis
Review comprehensive test results:
- Smoke tests: `test-results/smoke/index.html`
- Story validation: `test-results/story-validation-{STORY}/`
- JSON reports: `test-results/smoke-results.json`
- Screenshots: `test-results/*/`

### 4. Gate Decision Matrix

| Status | Smoke Tests | Story Validation | Recommendation |
|--------|-------------|------------------|----------------|
| PASS | ✅ Pass | ✅ Pass | Approve merge |
| CONCERNS | ✅ Pass | ⚠️ Issues | Review story validation issues |
| FAIL | ❌ Fail | ❌ Fail | Block merge, fix issues |

## Performance Thresholds

### Current Standards
- **Page Load**: < 5000ms
- **First Contentful Paint**: < 2000ms
- **DOM Interactive**: < 3000ms
- **Memory Growth**: < 50MB during navigation
- **Network Requests**: < 100 total
- **Failed Resources**: 0 critical failures

### Adjusting Thresholds
Update thresholds in `tests/e2e/mcp-smoke.spec.ts`:
```typescript
// Example: Adjust load time threshold
expect(loadTime).toBeLessThan(5000) // Change as needed
```

## Troubleshooting

### Common Issues

#### 1. Flaky Tests
**Symptoms**: Tests pass/fail inconsistently
**Solutions**:
- Increase timeouts in `playwright.smoke.config.ts`
- Add explicit waits with `page.waitForLoadState('networkidle')`
- Use more specific selectors

#### 2. Performance Regressions
**Symptoms**: Slow load times, high memory usage
**Solutions**:
- Check bundle size changes
- Review new dependencies
- Analyze network requests
- Profile with browser dev tools

#### 3. Mobile Test Failures
**Symptoms**: Tests pass on desktop, fail on mobile
**Solutions**:
- Check responsive design issues
- Verify touch interactions
- Review viewport-specific CSS

#### 4. CI Environment Issues
**Symptoms**: Tests pass locally, fail in CI
**Solutions**:
- Check CI browser installation
- Verify CI network access
- Review CI resource limits
- Use appropriate retry settings

### Debugging Workflow

1. **Local Reproduction**
   ```bash
   npm run test:smoke -- --project=chromium-smoke
   ```

2. **Headed Debugging**
   ```bash
   npx playwright test --config=playwright.smoke.config.ts --headed --project=chromium-smoke
   ```

3. **Trace Analysis**
   ```bash
   npx playwright show-trace test-results/smoke/trace.zip
   ```

4. **Screenshot Review**
   Check `test-results/smoke/` for failure screenshots

## Best Practices

### Test Design
- **Focus on User Journeys**: Test what users actually do
- **Avoid Implementation Details**: Test through the UI, not internals
- **Keep Tests Fast**: Smoke tests should run in under 2 minutes
- **Use Stable Selectors**: Prefer data-testid over CSS selectors

### Maintenance
- **Regular Updates**: Update tests when UI changes
- **Monitor Performance**: Track performance trends over time
- **Review Failures**: Address test failures promptly
- **Documentation**: Keep test documentation current

### Performance Monitoring
- **Baseline Establishment**: Record initial performance metrics
- **Regression Detection**: Monitor for performance degradation
- **Trend Analysis**: Track performance over releases
- **Threshold Adjustment**: Update thresholds based on real data

## Extending Smoke Tests

### Adding New Test Categories
1. Create new describe block in smoke test files
2. Follow existing naming conventions
3. Include performance and error monitoring
4. Update documentation

### Integrating Additional Browsers
Update `playwright.smoke.config.ts`:
```typescript
projects: [
  {
    name: 'firefox-smoke',
    use: { ...devices['Desktop Firefox'] }
  },
  {
    name: 'safari-smoke',
    use: { ...devices['Desktop Safari'] }
  }
]
```

### Custom Metrics
Add custom performance metrics in MCP smoke tests:
```typescript
const customMetrics = await page.evaluate(() => {
  // Your custom metric collection
  return { customValue: /* metric calculation */ }
})
```

## Results Interpretation

### PASS Status
- All smoke tests pass
- Performance metrics within thresholds
- No critical JavaScript errors
- Cross-browser compatibility confirmed

### CONCERNS Status
- Tests pass but with warnings
- Performance metrics near thresholds
- Minor accessibility issues
- Non-critical network failures

### FAIL Status
- Core functionality broken
- Critical JavaScript errors
- Performance thresholds exceeded
- Cross-browser compatibility issues

## Continuous Improvement

### Metrics to Track
- Smoke test execution time
- Pass/fail rates over time
- Performance trends
- Most common failure points

### Process Optimization
- Regular test suite reviews
- Performance threshold adjustments
- CI pipeline optimization
- Developer feedback incorporation

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run test:smoke` | Run all smoke tests |
| `npm run test:smoke:mobile` | Mobile smoke tests only |
| `npm run test:smoke:ci` | CI-friendly smoke tests |
| `npm run test:story` | Run story validation tests |
| `npm run test:story:ci` | CI-friendly story validation |
| `*gate {story} browser-smoke` | Quinn's smoke gate command |
| `*task create-story-validation` | Generate story validation test |

## Support

For smoke testing issues:
1. Check this documentation
2. Review test results in HTML report
3. Consult Troubleshooting section
4. Contact QA team for complex issues