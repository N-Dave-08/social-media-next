# DevOps Documentation

This document provides comprehensive information about the DevOps setup, CI/CD pipeline, and infrastructure configuration for the Social Media App.

## Table of Contents

- [Overview](#overview)
- [Development Environment](#development-environment)
- [Docker Configuration](#docker-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Testing Strategy](#testing-strategy)
- [Environment Management](#environment-management)
- [Deployment](#deployment)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

## Overview

This project implements a complete DevOps pipeline with industry best practices:

- **Containerization** with Docker and Docker Compose
- **CI/CD** with GitHub Actions
- **Testing** with Jest and React Testing Library
- **Code Quality** with Biome linting and formatting
- **Infrastructure as Code** (coming soon with Terraform)

## Development Environment

### Prerequisites

- Node.js 18+
- pnpm package manager
- Docker and Docker Compose
- Git

### Local Setup

```bash
# Clone repository
git clone <your-repo-url>
cd social-media-app

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development environment
docker-compose up --build
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/socialmedia"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# Admin User (for development)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin-password"
```

## Docker Configuration

### Development Environment

The `docker-compose.yml` file sets up a complete development environment:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/social_media_db?schema=public
      # ... other environment variables
    depends_on:
      - postgres
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=social_media_db
    ports:
      - "51214:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### Production Build

The `Dockerfile` creates an optimized production image:

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Commands

```bash
# Build image
docker build -t social-media-app .

# Run container
docker run -p 3000:3000 social-media-app

# Start development environment
docker-compose up --build

# Stop development environment
docker-compose down

# View logs
docker-compose logs app
docker-compose logs postgres

# Access container shell
docker exec -it <container_name> sh
```

## CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/ci-cd.yml` file defines the automated pipeline:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, master]
  pull_request:
    branches: [main, master]

env:
  NODE_ENV: test
  NEXTAUTH_SECRET: test-secret-key-for-ci-cd-pipeline
  JWT_SECRET: test-jwt-secret-key-for-ci-cd-pipeline

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: latest
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Generate Prisma client
      run: npx prisma generate
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run linting
      run: pnpm run lint
    
    - name: Build application
      run: pnpm run build
    
    - name: Run tests
      run: pnpm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v4
      with:
        version: latest
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Generate Prisma client
      run: npx prisma generate
    
    - name: Build Docker image
      run: docker build -t social-media-app .
    
    - name: Test Docker image
      run: docker run --rm social-media-app pnpm test
    
    - name: Verify Docker image runs
      run: |
        docker run --rm -d --name test-app -p 3001:3000 social-media-app
        sleep 10
        curl -f http://localhost:3001/api/test || exit 1
        docker stop test-app
        docker rm test-app
```

### Pipeline Stages

1. **Test Job**
   - Runs on every push and pull request
   - Sets up Node.js and pnpm
   - Installs dependencies
   - Generates Prisma client
   - Runs database migrations
   - Executes linting checks
   - Builds application
   - Runs Jest tests

2. **Build & Deploy Job**
   - Only runs on main branch
   - Builds Docker image
   - Tests Docker container
   - Verifies container functionality

### Pipeline Triggers

- **Push to main/master** - Runs full pipeline (test + build)
- **Push to develop** - Runs test job only
- **Pull requests** - Runs test job for validation

## Testing Strategy

### Testing Framework

- **Jest** - Primary testing framework
- **React Testing Library** - Component testing utilities
- **TypeScript** - Type-safe testing
- **Environment-aware tests** - Work in local and CI/CD

### Test Structure

```typescript
// Example test file: src/lib/storage/aws-s3.test.ts
import { resolve } from "node:path";
import { config } from "dotenv";

// Load environment variables from .env.local (only in local development)
if (process.env.NODE_ENV !== 'test') {
  config({ path: resolve(process.cwd(), ".env.local") });
}

describe('AWS S3 Configuration', () => {
  // Skip these tests in CI/CD if AWS credentials aren't available
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && 
                           process.env.AWS_SECRET_ACCESS_KEY && 
                           process.env.AWS_S3_BUCKET_NAME;

  describe('when AWS credentials are available', () => {
    beforeAll(() => {
      if (!hasAwsCredentials) {
        console.log('⚠️ Skipping AWS tests - no credentials available');
      }
    });

    it('should have all required environment variables set', () => {
      if (!hasAwsCredentials) {
        console.log('⏭️ Skipping test - no AWS credentials');
        return;
      }

      const requiredEnvVars = [
        "AWS_REGION",
        "AWS_ACCESS_KEY_ID", 
        "AWS_SECRET_ACCESS_KEY",
        "AWS_S3_BUCKET_NAME",
      ];

      requiredEnvVars.forEach((varName) => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });
  });

  // Always run this test to ensure basic environment setup
  it('should have basic environment configuration', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.NODE_ENV).toBe('test');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/lib/storage/aws-s3.test.ts
```

### Test Configuration

The `jest.config.ts` file configures the testing environment:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(customJestConfig)
```

## Environment Management

### Environment Files

- **`.env`** - Default environment variables (version controlled)
- **`.env.local`** - Local development variables (gitignored)
- **`.env.production`** - Production variables (gitignored)

### Environment Variables by Stage

#### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media_db
```

#### Testing (CI/CD)
```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
NEXTAUTH_SECRET=test-secret-key-for-ci-cd-pipeline
JWT_SECRET=test-jwt-secret-key-for-ci-cd-pipeline
```

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/social_media_db
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
```

## Deployment

### Current Status

- ✅ **Local development** - Docker Compose setup
- ✅ **CI/CD pipeline** - GitHub Actions automation
- ✅ **Testing** - Jest framework with CI/CD integration
- 🔄 **Production deployment** - Coming soon with Terraform

### Future Deployment (Terraform)

The next phase will include:

- **AWS infrastructure** with Terraform
- **ECS cluster** for container orchestration
- **RDS database** for production data
- **Load balancer** for traffic distribution
- **S3 bucket** for file storage
- **CloudFront** for CDN

## Monitoring & Observability

### Current Monitoring

- **GitHub Actions** - Pipeline execution monitoring
- **Jest** - Test results and coverage
- **Docker** - Container health and logs

### Future Monitoring

- **CloudWatch** - AWS service monitoring
- **Application logs** - Structured logging
- **Performance metrics** - Response times and throughput
- **Error tracking** - Exception monitoring

## Troubleshooting

### Common Issues

#### Docker Issues

**Port conflicts:**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Stop conflicting services
docker-compose down
```

**Database connection errors:**
```bash
# Check container status
docker ps

# View container logs
docker-compose logs postgres
```

#### CI/CD Issues

**Tests failing in pipeline:**
- Ensure environment variables are set correctly
- Check that tests work locally first
- Verify Jest configuration

**Build failures:**
- Check Docker build locally
- Verify all dependencies are installed
- Check for syntax errors

#### Testing Issues

**Jest not running:**
```bash
# Install missing dependencies
pnpm add -D @types/jest ts-node

# Check Jest configuration
pnpm test --verbose
```

**Environment variable issues:**
- Verify `.env.local` file exists
- Check variable names match test expectations
- Ensure tests handle missing variables gracefully

### Getting Help

1. **Check logs** - Docker and application logs
2. **Run locally** - Test commands locally first
3. **Check documentation** - This file and README.md
4. **Review pipeline** - GitHub Actions logs for CI/CD issues

## Best Practices

### Development

- **Always run tests** before committing
- **Use Docker** for consistent environments
- **Follow linting rules** with Biome
- **Update documentation** when making changes

### CI/CD

- **Test locally first** - Don't rely on pipeline for testing
- **Use meaningful commit messages** - Helps with debugging
- **Monitor pipeline results** - Fix failures quickly
- **Keep tests fast** - Pipeline should complete quickly

### Testing

- **Write environment-aware tests** - Work in all environments
- **Mock external services** - Don't depend on external APIs
- **Test edge cases** - Cover error conditions
- **Maintain test coverage** - Aim for high coverage

## Future Enhancements

### Planned Improvements

- **Infrastructure as Code** - Terraform for AWS
- **Production deployment** - ECS cluster deployment
- **Monitoring** - CloudWatch and logging
- **Security scanning** - Dependency and code scanning
- **Performance testing** - Load testing and optimization

### Technology Stack Evolution

- **Current**: Docker + GitHub Actions + Jest
- **Next**: Terraform + AWS + ECS
- **Future**: Kubernetes + Advanced monitoring + Security

---

This documentation is maintained alongside the codebase. Please update it when making changes to the DevOps setup. 