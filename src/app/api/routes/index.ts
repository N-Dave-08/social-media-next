import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "../middleware/cors";
import adminUpdateRole from "./admin/update-role";
import adminUsers from "./admin/users";
import authLogin from "./auth/login";
import authLogout from "./auth/logout";
import authLogoutAll from "./auth/logout-all";
import authRefresh from "./auth/refresh";
// Import route modules
import authSignup from "./auth/signup";
import posts from "./posts";
import comments from "./posts/comments";
import commentCreate from "./posts/comments/create";
import commentDelete from "./posts/comments/delete";
import commentUpdate from "./posts/comments/update";
import postLike from "./posts/like";
import test from "./test";
import avatarDelete from "./users/avatar/delete";
import avatarServe from "./users/avatar/serve";
import avatarUpload from "./users/avatar/upload";
import userChangePassword from "./users/change-password";
import userProfile from "./users/profile";
import userUpdateProfile from "./users/update-profile";

type Variables = {
  userId: string;
  userRole: string;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

// Global middleware
app.use("*", corsMiddleware);
app.use("*", logger());

// Auth routes (no auth required)
app.route("/auth/signup", authSignup);
app.route("/auth/login", authLogin);
app.route("/auth/refresh", authRefresh);
app.route("/auth/logout", authLogout);
app.route("/auth/logout-all", authLogoutAll);

// Posts routes
app.route("/posts", posts);
app.route("/", postLike);

// Comments routes
app.route("/posts/:postId/comments", comments);
app.route("/posts/:postId/comments", commentCreate);
app.route("/comments", commentUpdate);
app.route("/comments", commentDelete);

// User routes (require auth)
app.route("/users", userProfile);
app.route("/users", userUpdateProfile);
app.route("/users", userChangePassword);
app.route("/users", avatarUpload);
app.route("/users", avatarDelete);

// Avatar serve route (no auth required)
app.route("/", avatarServe);

// Admin routes (require admin)
app.route("/", adminUsers);
app.route("/", adminUpdateRole);

// Test routes (no auth required)
app.route("/", test);

export default app;
