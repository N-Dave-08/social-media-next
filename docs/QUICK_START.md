# Quick Start Guide

Get up and running with the Social Media App in under 10 minutes!

## 🚀 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - `npm install -g pnpm`
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## ⚡ Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd social-media-app

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# (Database, AWS, NextAuth secrets)
```

### 3. Start Everything

```bash
# Start the full stack with Docker
docker-compose up --build

# Your app is now running at http://localhost:3000! 🎉
```

## 🔧 Manual Setup (Alternative)

If you prefer not to use Docker:

```bash
# Install dependencies
pnpm install

# Set up database
pnpm run db:generate
pnpm run db:push

# Start development server
pnpm dev
```

## 📋 What You Get

✅ **Full-stack app** - Next.js + API routes + Database  
✅ **User authentication** - Signup, login, JWT tokens  
✅ **Social features** - Posts, comments, likes  
✅ **Admin dashboard** - User management  
✅ **File uploads** - Avatar management with AWS S3  
✅ **Real-time updates** - React Query integration  

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run linting
pnpm lint
```

## 🐳 Docker Commands

```bash
# Start development environment
docker-compose up --build

# View logs
docker-compose logs app
docker-compose logs postgres

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up --build
```

## 🌐 Access Points

- **App**: http://localhost:3000
- **Database**: localhost:51214 (PostgreSQL)
- **Prisma Studio**: Run `pnpm db:studio`

## 🚨 Common Issues

### Port 3000 already in use
```bash
# Check what's using the port
netstat -ano | findstr :3000

# Stop conflicting services or use different port
```

### Database connection failed
```bash
# Check if Docker is running
docker ps

# Restart containers
docker-compose down && docker-compose up --build
```

### Tests failing
```bash
# Install Jest types
pnpm add -D @types/jest

# Run tests locally first
pnpm test
```

## 📚 Next Steps

1. **Explore the app** - Create an account, make posts
2. **Check the code** - Review components and API routes
3. **Run tests** - Ensure everything works
4. **Make changes** - Start developing features
5. **Check CI/CD** - Push to GitHub to see automation

## 🆘 Need Help?

- **Documentation**: Check `docs/DEVOPS.md` for detailed info
- **Issues**: Look at GitHub Issues or create a new one
- **Code**: Review the source code and comments

---

**You're all set!** 🎉 Start building amazing social media features! 