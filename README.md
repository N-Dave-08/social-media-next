# Social Media App

A full-stack social media application built with Next.js, Hono, Prisma, and PostgreSQL.

## Features

- User authentication and authorization
- Post creation and management
- Comments and likes system
- User profiles with avatar management
- Admin dashboard for user management
- Real-time updates with React Query

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

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:push

# Run development server
npm run dev
```

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
