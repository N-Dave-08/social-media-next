import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: (origin) => origin,
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
});
