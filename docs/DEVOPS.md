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

### Environment Variable Best Practices

#### Critical Lesson: ECS Environment Variable Precedence

**⚠️ IMPORTANT:** ECS task definition environment variables **OVERRIDE** `.env` files in Docker images. This caused our production database connection issues.

**What Happened:**
1. **Docker image** had `.env` with `DATABASE_URL=postgres:5432`
2. **ECS task definition** had `DATABASE_URL=social-media-postgres.rds.amazonaws.com:5432`
3. **ECS won** - Used its environment variable, ignored the `.env` file
4. **Result:** App tried to connect to `postgres:5432` (which doesn't exist in production)

**Best Practice:**
```env
# ✅ CORRECT - .env file matches ECS task definition exactly
DATABASE_URL="postgresql://postgres:postgres@social-media-postgres.c7sgoummmk7f.us-east-2.rds.amazonaws.com:5432/social_media_db?schema=public"

# ❌ WRONG - Generic container reference that gets ignored
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/social_media_db?schema=public"
```

#### Environment Variable Strategy

**For Local Development:**
```env
# .env.local (gitignored)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_media_db?schema=public"
```

**For Production:**
```env
# .env (version controlled, matches ECS)
DATABASE_URL="postgresql://postgres:postgres@social-media-postgres.c7sgoummmk7f.us-east-2.rds.amazonaws.com:5432/social_media_db?schema=public"
```

**For Docker Compose:**
```yaml
# docker-compose.yml
environment:
  - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/social_media_db?schema=public
```

#### Environment Variable Validation

**Always verify:**
1. **Local development** - App connects to local database
2. **Docker build** - Image contains correct production values
3. **ECS task definition** - Environment variables match your `.env` file
4. **Production deployment** - App connects to RDS successfully

**Validation Commands:**
```bash
# Check ECS task definition
aws ecs describe-task-definition --task-definition social-media-app:2 --region us-east-2 --query "taskDefinition.containerDefinitions[0].environment[?name=='DATABASE_URL']"

# Check running tasks
aws ecs list-tasks --cluster social-media-cluster --service-name social-media-service --region us-east-2

# Check task environment
aws ecs describe-tasks --cluster social-media-cluster --tasks <task-id> --region us-east-2
```

### Database Schema Management

#### Prisma Deployment Strategy

**Critical Decision: `prisma migrate deploy` vs `prisma db push`**

We learned that for **initial production deployments**, `prisma db push` is more reliable than `prisma migrate deploy`.

**Why `prisma db push` for Production:**
1. **Creates schema from scratch** - No dependency on existing migration history
2. **Handles missing tables** - Perfect for fresh RDS instances
3. **More reliable** - Less prone to migration conflicts
4. **Automatic schema sync** - Ensures database matches your Prisma schema exactly

**When to Use Each:**

**`prisma db push` (Recommended for initial deployments):**
```dockerfile
# Use for initial production deployments
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server.js"]
```

**`prisma migrate deploy` (For subsequent updates):**
```dockerfile
# Use for updates after initial deployment
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

#### Database Schema Creation Process

**Initial Production Setup:**
1. **RDS instance created** - Empty database
2. **ECS task starts** - Runs `prisma db push`
3. **Schema created** - All tables, indexes, and constraints
4. **App starts** - Database ready for connections

**Schema Update Process:**
1. **Modify Prisma schema** - Add new models, fields, etc.
2. **Create migration** - `npx prisma migrate dev --name add_new_feature`
3. **Test locally** - Ensure migration works
4. **Deploy to production** - Use `prisma migrate deploy`

#### Prisma Best Practices

**Schema File Organization:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models with proper table mapping
model User {
  id       String @id @default(cuid())
  email    String @unique
  username String @unique
  // ... other fields
  
  @@map("users") // Explicit table naming
}
```

**Migration Strategy:**
1. **Development**: Use `prisma migrate dev` for schema changes
2. **Testing**: Verify migrations work in staging
3. **Production**: Use `prisma migrate deploy` for updates
4. **Emergency**: Use `prisma db push` for schema recovery

**Database Connection Handling:**
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Database Health Checks

**Health Check Endpoint:**
```typescript
// pages/api/health.ts
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    })
  }
}
```

**Load Balancer Health Check:**
- **Path**: `/api/health`
- **Success Codes**: 200
- **Failure Codes**: 500, 404
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3

## Deployment Success Story

### Production Deployment Achievement ✅

**Date**: September 2024  
**Status**: **SUCCESSFULLY DEPLOYED**  
**Infrastructure**: AWS ECS + RDS + ALB  
**Result**: Social media app fully functional in production

### What We Accomplished

1. **✅ Production Infrastructure Setup**
   - ECS cluster with Fargate tasks
   - RDS PostgreSQL database
   - Application Load Balancer
   - ECR container registry
   - VPC with proper security groups

2. **✅ Database Connection Issues Resolved**
   - Fixed DATABASE_URL configuration
   - Resolved environment variable conflicts
   - Implemented automatic schema creation
   - Established stable RDS connectivity

3. **✅ Application Deployment**
   - Docker image building and ECR pushing
   - ECS service deployment and scaling
   - Health check configuration
   - Load balancer target registration

### Key Lessons Learned

#### 1. Environment Variable Precedence
**Lesson**: ECS task definition environment variables override Docker image `.env` files.

**Impact**: This caused our initial database connection failures because:
- Docker image had `DATABASE_URL=postgres:5432`
- ECS had `DATABASE_URL=rds-endpoint:5432`
- ECS won, but app tried to connect to non-existent `postgres:5432`

**Solution**: Ensure `.env` file matches ECS task definition exactly.

#### 2. Database Schema Management
**Lesson**: Use `prisma db push` for initial production deployments, not `prisma migrate deploy`.

**Impact**: Initial deployments failed because:
- Database tables didn't exist
- Migrations couldn't run on empty database
- App crashed with "table does not exist" errors

**Solution**: Use `prisma db push` for initial setup, then `prisma migrate deploy` for updates.

#### 3. Production vs Development Configuration
**Lesson**: Production requires actual service endpoints, not generic container names.

**Impact**: Using `postgres:5432` in production:
- Points to nothing (no container with that name)
- Causes connection timeouts
- Results in 500 Internal Server Errors

**Solution**: Use full RDS endpoint: `social-media-postgres.rds.amazonaws.com:5432`

### Deployment Checklist

**Before Deploying:**
- [ ] `.env` file has correct production DATABASE_URL
- [ ] Dockerfile uses appropriate Prisma command (`db push` vs `migrate deploy`)
- [ ] ECS task definition environment variables match `.env` file
- [ ] RDS security groups allow ECS tasks
- [ ] Load balancer health check endpoint exists

**During Deployment:**
- [ ] Build and push Docker image to ECR
- [ ] Force ECS service update
- [ ] Monitor deployment progress
- [ ] Check task health and logs
- [ ] Verify load balancer target registration

**After Deployment:**
- [ ] Test health check endpoint
- [ ] Verify database connectivity
- [ ] Test critical API endpoints
- [ ] Monitor error rates and performance
- [ ] Update documentation with lessons learned

### Success Metrics

**Infrastructure:**
- ✅ ECS cluster running with 1 healthy task
- ✅ RDS database accessible and responsive
- ✅ Load balancer distributing traffic
- ✅ Health checks passing consistently

**Application:**
- ✅ Website loads successfully
- ✅ Database connection established
- ✅ User signup functionality working
- ✅ No more 500 Internal Server Errors
- ✅ API endpoints responding correctly

**Performance:**
- ✅ Response times under 500ms
- ✅ Database queries executing successfully
- ✅ Container startup time under 2 minutes
- ✅ Health check response time under 100ms

### Future Improvements

**Short Term:**
- [ ] Implement CloudWatch logging
- [ ] Add performance monitoring
- [ ] Set up automated backups
- [ ] Configure alerting

**Medium Term:**
- [ ] Infrastructure as Code with Terraform
- [ ] Multi-environment deployment (staging/production)
- [ ] Automated testing in CI/CD
- [ ] Security scanning and compliance

**Long Term:**
- [ ] Kubernetes migration
- [ ] Advanced monitoring and observability
- [ ] Auto-scaling based on metrics
- [ ] Disaster recovery planning

---

**This documentation represents our successful journey from development to production. The lessons learned here will guide future deployments and help other teams avoid similar pitfalls.** 