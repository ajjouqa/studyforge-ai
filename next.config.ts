import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native / Prisma packages out of the server bundle so the
  // better-sqlite3 native addon and the generated client load at runtime.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "unpdf",
    "mammoth",
    "jszip",
    "jsdom",
  ],
};

export default nextConfig;
