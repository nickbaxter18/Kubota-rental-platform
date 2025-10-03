# Testing Infrastructure Guide

## Overview
This document outlines the comprehensive testing infrastructure for the Kubota Rental Platform, ensuring high-quality, reliable, and performant software delivery.

## Environment Requirements

### System Prerequisites
- **Operating System**: Linux (Ubuntu 22.04+ recommended)
- **Locale**: en_US.UTF-8 (critical for consistent test behavior)
- **Node.js**: >= 20.x
- **PNPM**: >= 9.x
- **Docker**: For containerized testing environments

### Database Configuration
- **Test Database**: PostgreSQL 15
- **Connection**: postgresql://test:test@localhost:5432/udigit_test
- **Redis**: localhost:6379 (for caching tests)

### Environment Variables
```bash
# .env.test
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
STRIPE_SECRET_KEY=sk_test_mock_key_for_testing
DATABASE_URL=postgresql://test:test@localhost:5432/udigit_test
REDIS_URL=redis://localhost:6379
DISABLE_EXTERNAL_SERVICES=true
```

## Running Tests

### Quick Start
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run only critical path tests
pnpm test:critical

# Performance tests only
pnpm test:performance

# Accessibility audit
pnpm test:accessibility

# E2E tests only
pnpm test:e2e
```

### Test Scripts
- `pnpm test` - Run all unit and integration tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate coverage reports
- `pnpm test:critical` - Run only critical path tests
- `pnpm test:performance` - Performance regression tests
- `pnpm test:accessibility` - Accessibility compliance check

## Critical Path Tests

| Test ID | Description | Required Outcome | Max Duration | Status |
|---------|-------------|------------------|--------------|--------|
| CP-01 | Equipment search | <1s response, 0 errors | 200ms | ✅ |
| CP-02 | Booking creation | Confirmation ID returned | 2s | ✅ |
| CP-03 | Payment processing | Success webhook received | 3s | ⚠️ |
| CP-04 | Booking confirmation email | Delivered within 5s | 5s | ✅ |

## Performance Thresholds

### Lighthouse Scores
- **Performance**: ≥ 80
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 85
- **SEO**: ≥ 90

### Core Web Vitals
- **FCP (First Contentful Paint)**: < 2.5s
- **LCP (Largest Contentful Paint)**: < 4.0s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TBT (Total Blocking Time)**: < 500ms

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Color contrast ratio ≥ 4.5:1
- All interactive elements keyboard accessible
- Screen reader compatibility
- Focus management
- Alternative text for images

### Testing Tools
- **Axe-core**: Automated accessibility testing
- **Lighthouse**: Accessibility audit
- **Manual Testing**: Quarterly comprehensive review

## Test Data Management

### Factories
- **Backend**: `TestDataFactory` in `backend/src/test/test-utils.ts`
- **Frontend**: `TestDataFactory` in `frontend/e2e/test-data-factory.ts`

### Seeding Test Data
```typescript
// Backend
const { user, equipment, booking } = await createDatabaseHelpers(app).seedTestData();

// Frontend E2E
const factory = createTestDataFactory();
const booking = factory.createBooking({ startDate: '2024-12-15' });
```

## CI/CD Pipeline

### Quality Gates
1. **Type Checking** - All TypeScript errors must be resolved
2. **Linting** - Code style compliance
3. **Unit Tests** - ≥ 80% coverage, all tests passing
4. **Integration Tests** - All critical paths functional
5. **E2E Tests** - All user journeys working
6. **Performance** - No regressions > 10%
7. **Accessibility** - WCAG 2.1 AA compliance
8. **Security** - No high-severity vulnerabilities

### Pipeline Stages
- **Quality**: Type checking, linting, building
- **Test**: Unit, integration, and E2E tests
- **Performance**: Lighthouse and performance regression
- **Security**: Dependency and vulnerability scanning
- **Deploy**: Only after all gates pass

## Monitoring & Alerting

### Real-time Alerts
- **Slack Notifications**: Test failures, performance regressions
- **Email Alerts**: Critical path failures, accessibility issues
- **Dashboard**: Real-time test health metrics

### Weekly Reports
- Test stability and flakiness rates
- Performance trends and regressions
- Coverage analysis and recommendations
- Action items and priorities

## Troubleshooting

### Common Issues

#### Locale Issues
```bash
# Fix locale in Docker
docker run --env LANG=en_US.UTF-8 --env LC_ALL=en_US.UTF-8

# Fix locale in CI
echo 'LC_ALL=en_US.UTF-8' >> $GITHUB_ENV
echo 'LANG=en_US.UTF-8' >> $GITHUB_ENV
```

#### Database Connection Issues
```bash
# Verify database connectivity
PGPASSWORD=test_password psql -h localhost -p 5432 -U test_user -d udigit_test -c "SELECT 1"

# Reset test database
pnpm run test:db:reset
```

#### Flaky Tests
1. Check for timing issues
2. Verify test isolation
3. Review external dependencies
4. Consider increasing timeouts for network tests

## Contributing

### Adding New Tests
1. Follow existing patterns in test files
2. Use appropriate factories for test data
3. Ensure proper cleanup in afterEach/beforeEach
4. Add performance monitoring for critical paths
5. Include accessibility considerations

### Test Review Checklist
- [ ] Tests are isolated and independent
- [ ] Test data is created using factories
- [ ] Cleanup is performed after each test
- [ ] Performance impact is considered
- [ ] Accessibility is tested where applicable
- [ ] Error scenarios are covered
- [ ] Documentation is updated if needed

## Maintenance Schedule

| Task | Frequency | Owner | Status |
|------|-----------|-------|--------|
| Update browser targets | Monthly | Frontend Team | ✅ |
| Refresh test data | Weekly | QA Team | ✅ |
| Review flaky tests | Daily | Engineering | ✅ |
| Audit accessibility | Quarterly | Compliance | ✅ |
| Performance review | Monthly | DevOps | ✅ |
| Security audit | Monthly | Security Team | ✅ |

## Support

For testing infrastructure issues:
1. Check this documentation first
2. Review recent CI/CD logs
3. Consult the test health dashboard
4. Escalate to the testing infrastructure team
