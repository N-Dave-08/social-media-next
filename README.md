# Social Media App

A full-stack social media application built with Next.js, Hono, Prisma, and PostgreSQL, with complete DevOps automation including Docker, CI/CD, and testing.

## Features

- User authentication and authorization
- Post creation and management
- Comments and likes system
- User profiles with avatar management
- Admin dashboard for user management
- Real-time updates with React Query

## DevOps & Infrastructure

This project includes a complete DevOps setup with industry best practices:

### 🐳 **Containerization (Docker)**
- **Multi-stage Docker build** for optimized production images
- **Docker Compose** for local development with PostgreSQL
- **Production-ready containers** with proper security and optimization
- **Standalone Next.js output** for efficient containerization

### 🔄 **CI/CD Pipeline (GitHub Actions)**
- **Automated testing** on every push and pull request
- **Multi-stage pipeline** with test and build jobs
- **Database testing** with PostgreSQL service containers
- **Docker image building** and verification
- **Code quality checks** with linting and formatting
- **Environment-specific configurations** for different stages

### 🧪 **Testing Framework (Jest + TypeScript)**
- **Jest testing framework** with TypeScript support
- **React Testing Library** for component testing
- **Environment-aware tests** that work locally and in CI/CD
- **Automated test execution** in CI/CD pipeline
- **Code coverage reporting** and quality gates

### 🏗️ **Development Environment**
- **Local PostgreSQL** database with Docker
- **Environment management** with .env files
- **Database migrations** with Prisma
- **Hot reloading** with Next.js development server

## Avatar System

The app includes a complete avatar management system:

### How it works:
1. **Upload**: Users can upload avatar images (JPG, PNG, GIF, WebP)
2. **Storage**: Images are stored in AWS S3 bucket
3. **Serving**: Images are served directly from S3/CloudFront CDN
4. **Database**: Avatar URLs are stored as S3/CloudFront URLs
5. **Cleanup**: Files are automatically deleted from S3 when avatars are removed

### File handling:
- **Supported formats**: JPG, PNG, GIF, WebP (converted to optimized JPEG)
- **Max size**: 2MB per image (optimized for performance)
- **Storage location**: AWS S3 bucket with CloudFront CDN
- **URL format**: `https://your-bucket.s3.region.amazonaws.com/avatars/filename.jpg` or CloudFront URL
- **File naming**: Secure UUID-based naming with timestamp
- **Image processing**: Resized to 400x400px, EXIF stripped, optimized JPEG

### Security:
- **File validation**: Type, size, and extension validation
- **File size limits**: 2MB maximum for performance
- **Authentication**: Required for all avatar operations
- **File cleanup**: Automatic deletion on removal
- **Security headers**: X-Content-Type-Options, X-Frame-Options
- **Filename validation**: Prevents directory traversal attacks
- **UUID naming**: Secure, unpredictable filenames
- **EXIF stripping**: All metadata removed for privacy
- **Image optimization**: Resized and compressed for security

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone <your-repo-url>
cd social-media-app

# Start the full stack with Docker Compose
docker-compose up --build

# Access your app at http://localhost:3000
```

### Manual Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
pnpm run db:generate
pnpm run db:push

# Run development server
pnpm dev
```

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio

# Testing & Quality
pnpm test             # Run Jest tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm lint             # Run Biome linting
pnpm format           # Format code with Biome

# Docker
docker-compose up     # Start development environment
docker-compose down   # Stop development environment
```

### Environment Variables

Create a `.env.local` file with:

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

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- **Unit tests** for utility functions and components
- **Integration tests** for API endpoints and database operations
- **Environment-aware tests** that work in local and CI/CD environments
- **Mocked external services** for reliable testing

## CI/CD Pipeline

### Pipeline Stages

1. **Test Job**
   - Setup Node.js and pnpm
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Execute linting checks
   - Build application
   - Run Jest tests

2. **Build & Deploy Job** (main branch only)
   - Build Docker image
   - Test Docker container
   - Verify container functionality

### Pipeline Triggers

- **Push to main/master** - Runs full pipeline
- **Push to develop** - Runs test job only
- **Pull requests** - Runs test job for validation

## Docker

### Development Environment

```yaml
# docker-compose.yml
services:
  app:          # Next.js application
  postgres:     # PostgreSQL database
  # Add more services as needed
```

### Production Build

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS base
# ... optimized production image
```

## Production Deployment

### 🚀 **AWS ECS Deployment (COMPLETED)**

Our social media app is **successfully deployed to production** using AWS infrastructure:

#### **🌐 Production Website**
**Live Application**: [http://social-media-alb-1380272211.us-east-2.elb.amazonaws.com](http://social-media-alb-1380272211.us-east-2.elb.amazonaws.com)

**Status**: ✅ **FULLY OPERATIONAL**
- Website loads successfully
- Database connection established
- User signup functionality working
- All API endpoints responding correctly

#### **Production Infrastructure**
- **✅ ECS Cluster** - Container orchestration with Fargate
- **✅ RDS PostgreSQL** - Production database
- **✅ Application Load Balancer** - Traffic distribution
- **✅ ECR** - Container registry
- **✅ VPC** - Network isolation and security

#### **Production URL**
🌐 **Live Application**: `http://social-media-alb-1380272211.us-east-2.elb.amazonaws.com`

#### **Deployment Commands**
```bash
# 1. Build production image
docker build -t social-media-app-test:latest .

# 2. Tag for ECR
docker tag social-media-app-test:latest 337909777510.dkr.ecr.us-east-2.amazonaws.com/social-media-app:latest

# 3. Authenticate with ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 337909777510.dkr.ecr.us-east-2.amazonaws.com

# 4. Push to ECR
docker push 337909777510.dkr.ecr.us-east-2.amazonaws.com/social-media-app:latest

# 5. Deploy to ECS
aws ecs update-service --cluster social-media-cluster --service social-media-service --force-new-deployment --region us-east-2
```

#### **Production Environment Variables**
```env
# Production Database (AWS RDS)
DATABASE_URL="postgresql://postgres:postgres@social-media-postgres.c7sgoummmk7f.us-east-2.rds.amazonaws.com:5432/social_media_db?schema=public"

# Production Settings
NODE_ENV=production
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
```

#### **Key Production Features**
- **✅ Auto-scaling** - ECS handles traffic spikes
- **✅ Health checks** - Load balancer monitors app health
- **✅ Database persistence** - RDS with automated backups
- **✅ Security** - VPC isolation and security groups
- **✅ Monitoring** - ECS service events and CloudWatch

#### **Production Architecture**

## 🏗️ AWS Ecosystem Architecture

Our production deployment uses a comprehensive AWS infrastructure:

### 🌐 Complete Infrastructure Diagram

```mermaid
graph TB
    subgraph "🌐 Internet"
        User[👤 Users]
        Internet[🌐 Internet Gateway]
    end
    
    subgraph "🏗️ AWS Infrastructure"
        subgraph "📡 Load Balancing"
            ALB[🔀 Application Load Balancer<br/>social-media-alb<br/>Port 80]
        end
        
        subgraph "🖥️ ECS Infrastructure"
            ECRRepo[📦 ECR Repository<br/>social-media-app]
            ECSCluster[⚙️ ECS Cluster<br/>social-media-cluster<br/>Fargate]
            
            subgraph "🐳 ECS Service"
                ECSService[🔄 ECS Service<br/>social-media-service]
                Task1[🏃 Task Instance<br/>Next.js App<br/>Port 3000]
            end
        end
        
        subgraph "🗄️ Database"
            RDS[🗄️ RDS PostgreSQL<br/>social-media-postgres]
        end
        
        subgraph "🔒 Security"
            VPC[🏠 VPC Network]
            SG[🛡️ Security Groups]
        end
        
        subgraph "🔑 Admin Management"
            AdminTask[⚡ Database Seeding<br/>Auto Admin Creation]
        end
    end
    
    %% Traffic Flow
    User -->|HTTP Requests| Internet
    Internet --> ALB
    ALB -->|Target Group| Task1
    Task1 -->|Database Queries| RDS
    
    %% Infrastructure
    ECRRepo -->|Pull Images| ECSService
    ECSService --> Task1
    AdminTask -->|Seed Database| RDS
    VPC -.-> Task1
    VPC -.-> RDS
    SG -.-> ALB
    SG -.-> Task1
    SG -.-> RDS
```

### 🎯 **Production Highlights**
- **✅ Auto-scaling ECS Fargate** - Serverless container orchestration
- **✅ Load-balanced traffic** - High availability with health checks
- **✅ Secure networking** - VPC isolation with security groups
- **✅ Automatic admin creation** - Database seeding on deployment
- **✅ Comprehensive monitoring** - CloudWatch logs and metrics
- **✅ Zero-downtime deployments** - Rolling updates with health checks

### 🔧 **Production Troubleshooting**

**Common Issues & Solutions:**

1. **Database Connection Failed (500 Error)**
   - **Cause**: Wrong DATABASE_URL or environment variable conflicts
   - **Solution**: Ensure `.env` file matches ECS task definition exactly

2. **ECS Deployment Stuck**
   - **Cause**: Tasks failing to start or health check failures
   - **Solution**: Check task logs and environment variables

3. **Missing Database Tables**
   - **Cause**: Prisma migrations haven't run
   - **Solution**: Use `prisma db push` in Dockerfile for initial deployments

**For detailed troubleshooting, see our [DevOps Documentation](docs/DEVOPS.md)**

### 📚 **Deployment Documentation**

- **📖 [DevOps Guide](docs/DEVOPS.md)** - Complete deployment guide
- **📖 [Quick Start](docs/QUICK_START.md)** - Local development setup
- **📖 [Database ERD](docs/DATABASE_ERD.md)** - Database schema documentation

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/password` - Change password
- `PUT /api/users/me/avatar` - Upload avatar
- `DELETE /api/users/me/avatar` - Remove avatar

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id/role` - Update user role (admin only)

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the coding standards
4. **Run tests locally** (`pnpm test`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Quality Standards

- **TypeScript** for type safety
- **Biome** for linting and formatting
- **Jest** for testing
- **Docker** for consistent environments
- **Environment variables** for configuration

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Prisma Documentation](https://www.prisma.io/docs) - Database ORM
- [Jest Documentation](https://jestjs.io/docs) - Testing framework
- [Docker Documentation](https://docs.docker.com/) - Containerization
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD automation

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
