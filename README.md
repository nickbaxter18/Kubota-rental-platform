# 🚀 U-Dig It Rentals Platform

A production-ready **Next.js + NestJS** rental platform for Kubota SVL-75 equipment, built with modern web technologies and enterprise-grade architecture.

## 🏗️ Architecture Overview

This platform implements the comprehensive **Next.js + NestJS** architecture from the provided guide, featuring:

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: NestJS 11+ with Fastify adapter, TypeORM, Redis
- **Database**: PostgreSQL with migration support
- **Caching**: Redis with tag-based invalidation
- **Jobs**: BullMQ for background processing
- **Monitoring**: Sentry for error tracking and performance monitoring
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Docker + GitHub Actions CI/CD

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **pnpm 9+**
- **Docker & Docker Compose**
- **PostgreSQL 15+** (or use Docker)
- **Redis 7+** (or use Docker)

### 1. Clone and Install

```bash
git clone <repository-url>
cd kubota-rental-platform

# Install all dependencies
pnpm install:all

# Copy environment files
cp .env.example .env
cp .env.example .env.local
```

### 2. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
pnpm docker:up

# Run database migrations
pnpm db:migrate

# Seed initial data (optional)
pnpm db:seed
```

### 3. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev:frontend  # Frontend on http://localhost:3000
pnpm dev:backend   # Backend API on http://localhost:3001
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🛠️ Development Setup

### Environment Variables

Create `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/udigit_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email Service (optional)
SENDGRID_API_KEY=SG...

# Monitoring
SENTRY_DSN=https://...
```

### Development Commands

```bash
# Development
pnpm dev                 # Start both frontend and backend
pnpm dev:frontend       # Start frontend only
pnpm dev:backend        # Start backend only

# Building
pnpm build              # Build all apps
pnpm --filter frontend build
pnpm --filter backend build

# Testing
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage

# Code Quality
pnpm lint               # Lint all code
pnpm type-check         # TypeScript check
pnpm format             # Format code

# Database
pnpm db:migrate         # Run migrations
pnpm db:seed           # Seed data

# Docker
pnpm docker:build      # Build images
pnpm docker:up         # Start services
pnpm docker:down       # Stop services
```

## 📁 Project Structure

```
kubota-rental-platform/
├── frontend/                 # Next.js 15 App Router
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── api/         # Route Handlers
│   │   │   ├── book/        # Booking flow
│   │   │   └── ...
│   │   ├── components/      # React components
│   │   ├── lib/            # Utilities and configurations
│   │   └── test/           # Test setup
│   ├── e2e/                # Playwright E2E tests
│   └── ...
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── bookings/       # Booking management
│   │   ├── payments/       # Payment processing
│   │   ├── contracts/      # Contract management
│   │   ├── insurance/      # Insurance verification
│   │   ├── jobs/          # Background job processors
│   │   ├── entities/      # Database entities
│   │   └── config/        # Configuration
│   └── ...
├── docker/                  # Docker configurations
│   ├── frontend/           # Frontend Dockerfile
│   ├── backend/            # Backend Dockerfile
│   └── postgres/           # Database setup
├── .github/                # GitHub Actions workflows
└── ...
```

## ✨ Key Features

### 🎯 Booking Flow
- **Multi-step booking process** with validation
- **Real-time availability checking**
- **Server-side pricing calculation**
- **Cache invalidation** after successful bookings
- **Mobile-responsive design**

### 🔐 Authentication & Security
- **JWT-based authentication** with refresh tokens
- **Rate limiting** (100 requests/15min)
- **CORS protection** with configurable origins
- **Security headers** (Helmet, CSP, XSS protection)
- **Input validation** with DTOs

### ⚡ Performance
- **Fastify adapter** for better throughput
- **Redis caching** with tag-based invalidation
- **Background job processing** with BullMQ
- **Database query optimization**
- **Image optimization** with Next.js

### 📊 Monitoring & Observability
- **Sentry integration** for error tracking
- **Performance monitoring** with Web Vitals
- **Custom metrics** collection
- **Health checks** and status endpoints
- **Request tracing** with correlation IDs

### 🧪 Testing
- **Unit tests** with Vitest and React Testing Library
- **E2E tests** with Playwright
- **Test database** with fixtures
- **Coverage reporting**
- **CI/CD integration**

### 🚀 Deployment
- **Multi-stage Docker builds**
- **Production-ready configurations**
- **Environment-specific settings**
- **Health checks** and zero-downtime deployments

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Bookings
- `GET /bookings` - List bookings with pagination
- `POST /bookings` - Create new booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/status` - Update booking status

#### Equipment
- `GET /equipment` - List equipment with filters
- `GET /equipment/:id` - Get equipment details
- `GET /equipment/:id/availability` - Check availability

#### Health
- `GET /health` - Application health check

### API Documentation
Visit http://localhost:3001/api for interactive Swagger documentation.

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm --filter frontend exec playwright test

# Test with UI
pnpm --filter frontend test:ui

# Coverage
pnpm test:coverage
```

### Test Structure

- **Unit Tests**: Component logic, utilities, services
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Complete user journeys, booking flow

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   cp .env.production .env
   # Configure all production variables
   ```

2. **Build and Deploy**
   ```bash
   # Build Docker images
   pnpm docker:build

   # Deploy with Docker Compose
   docker-compose -f docker-compose.production.yml up -d
   ```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- **Quality checks** (linting, type checking, building)
- **Automated testing** (unit + E2E)
- **Security scanning** (dependency vulnerabilities)
- **Docker image building** and registry publishing
- **Staging and production deployments**

### Environment Configurations

- **Development**: `.env` - Local development
- **Production**: `.env.production` - Production deployment
- **Testing**: Environment variables for CI/CD

## 📊 Monitoring

### Performance Monitoring
- **Web Vitals** tracking (FCP, LCP, CLS, FID, TTFB, INP)
- **Custom metrics** for API calls and user interactions
- **Performance observers** for long tasks and layout shifts

### Error Tracking
- **Sentry integration** for error capture and reporting
- **Error boundaries** for React component errors
- **API error monitoring** with request context

### Health Checks
- **Application health**: `/health` endpoint
- **Database connectivity** monitoring
- **Redis connection** status
- **Queue health** and job processing status

## 🔧 Configuration

### Feature Flags
The platform includes a feature flag system for gradual rollouts:

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

// Check if feature is enabled
const isDarkModeEnabled = useFeatureFlag('dark-mode');

// A/B testing
const variant = useABTest('pricing-experiment', ['control', 'variant-a']);
```

### Environment Variables
See `.env.example` for all available configuration options.

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make changes** with proper testing
   ```bash
   pnpm test          # Run tests
   pnpm type-check    # Check types
   pnpm lint          # Lint code
   ```

3. **Commit changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### Code Standards

- **TypeScript** for all new code
- **ESLint** and **Prettier** configuration
- **Conventional commits** for commit messages
- **Test coverage** for new features
- **Documentation** updates for API changes

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and API docs
- **Issues**: Create GitHub issues for bugs and features
- **Discussions**: Use GitHub Discussions for questions

### Common Issues

1. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL configuration
   - Run migrations: `pnpm db:migrate`

2. **Build failures**
   - Clear cache: `pnpm cache:clean`
   - Reinstall dependencies: `pnpm install:all`
   - Check Node.js version (20+ required)

3. **Test failures**
   - Ensure test database is running
   - Check environment variables
   - Run `pnpm db:migrate` for tests

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Next.js + NestJS architecture
- [x] Booking flow implementation
- [x] Authentication system
- [x] Payment integration

### Phase 2: Advanced Features ✅
- [x] Background job processing
- [x] Caching and performance optimization
- [x] Comprehensive testing
- [x] CI/CD pipeline

### Phase 3: Enterprise Features 🔄
- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Real-time notifications
- [ ] Mobile app API optimization

### Phase 4: Scale & Optimization 🔄
- [ ] Microservices architecture
- [ ] Advanced caching strategies
- [ ] Global CDN setup
- [ ] Performance optimization

---

**Built with ❤️ using Next.js 15, NestJS 11+, and modern web technologies**
