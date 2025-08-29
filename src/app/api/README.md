# API Route Organization

This directory contains the organized API routes for the social media application. The routes have been split into logical modules for better maintainability and organization.

## Directory Structure

```
src/app/api/
├── [[...route]]/
│   └── route.ts (main entry point)
├── routes/
│   ├── auth/ (authentication routes)
│   │   ├── signup.ts
│   │   ├── login.ts
│   │   ├── refresh.ts
│   │   ├── logout.ts
│   │   └── logout-all.ts
│   ├── posts/ (post-related routes)
│   │   ├── index.ts (GET /posts, POST /posts)
│   │   ├── like.ts (POST /posts/:id/like)
│   │   └── comments/ (comment routes)
│   │       ├── index.ts (GET /posts/:postId/comments)
│   │       ├── create.ts (POST /posts/:postId/comments)
│   │       ├── update.ts (PUT /comments/:id)
│   │       └── delete.ts (DELETE /comments/:id)
│   ├── users/ (user management routes)
│   │   ├── profile.ts (GET /users/me)
│   │   ├── update-profile.ts (PUT /users/me)
│   │   ├── change-password.ts (PUT /users/me/password)
│   │   └── avatar/ (avatar management)
│   │       ├── upload.ts (PUT /users/me/avatar)
│   │       ├── serve.ts (GET /avatars/:filename)
│   │       └── delete.ts (DELETE /users/me/avatar)
│   ├── admin/ (admin-only routes)
│   │   ├── users.ts (GET /admin/users)
│   │   └── update-role.ts (PATCH /admin/users/:id/role)
│   └── test/ (test routes)
│       └── index.ts (GET /test, GET /test-db)
├── middleware/ (authentication and authorization)
│   ├── auth.ts (JWT authentication)
│   ├── admin.ts (admin authorization)
│   └── cors.ts (CORS configuration)
├── schemas/ (Zod validation schemas)
│   ├── auth.ts (auth-related schemas)
│   ├── posts.ts (post schemas)
│   ├── users.ts (user schemas)
│   └── comments.ts (comment schemas)
├── utils/ (utility functions)
│   └── file-upload.ts (avatar upload utilities)
└── index.ts (route aggregator)
```

## Route Categories

### Authentication Routes (`/auth/*`)
- **No authentication required**
- Handle user registration, login, logout, and token refresh
- Manage JWT tokens and cookies

### Posts Routes (`/posts/*`)
- **GET /posts**: Get all posts (no auth required)
- **POST /posts**: Create a new post (auth required)
- **POST /posts/:id/like**: Like/unlike a post (auth required)

### Comments Routes (`/posts/:postId/comments/*`)
- **GET /posts/:postId/comments**: Get comments for a post (no auth required)
- **POST /posts/:postId/comments**: Create a comment (auth required)
- **PUT /comments/:id**: Update a comment (auth required)
- **DELETE /comments/:id**: Delete a comment (auth required)

### User Routes (`/users/*`)
- **All require authentication**
- Profile management, password changes, and avatar uploads

### Admin Routes (`/admin/*`)
- **All require admin authentication**
- User management and role updates

### Test Routes (`/test/*`)
- **No authentication required**
- Health checks and database connectivity tests

## Middleware

### Authentication Middleware
- `authMiddleware`: Validates JWT tokens and sets user context
- `adminMiddleware`: Extends auth middleware to check for admin role

### CORS Middleware
- Handles cross-origin requests with proper security headers

## Validation Schemas

All input validation is handled using Zod schemas:
- `signupSchema`: User registration validation
- `loginSchema`: Login validation
- `postSchema`: Post content validation
- `commentSchema`: Comment content validation
- `updateProfileSchema`: Profile update validation
- `changePasswordSchema`: Password change validation

## File Upload Utilities

The `file-upload.ts` utility handles:
- Avatar image processing with Sharp
- File validation (type, size, extension)
- Secure filename generation
- Image optimization and EXIF stripping

## Benefits of This Organization

1. **Modularity**: Each route type is in its own directory
2. **Maintainability**: Easy to find and modify specific functionality
3. **Reusability**: Middleware and utilities can be shared across routes
4. **Scalability**: Easy to add new routes without cluttering the main file
5. **Testing**: Individual route modules can be tested in isolation
6. **Code Splitting**: Better tree-shaking and bundle optimization

## Adding New Routes

To add a new route:

1. Create a new file in the appropriate directory under `routes/`
2. Import necessary middleware and schemas
3. Export the Hono app instance
4. Add the route to the aggregator in `routes/index.ts`

Example:
```typescript
// routes/posts/new-feature.ts
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const app = new Hono();

app.get("/new-feature", authMiddleware, async (c) => {
  // Route logic here
});

export default app;
```

Then add to `routes/index.ts`:
```typescript
import newFeature from "./posts/new-feature";
// ...
app.route("/posts", newFeature);
``` 