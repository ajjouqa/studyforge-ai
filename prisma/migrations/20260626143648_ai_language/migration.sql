-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "language" TEXT NOT NULL DEFAULT 'English',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDay" TEXT,
    "dailyGoal" INTEGER NOT NULL DEFAULT 20,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 150,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserStats" ("createdAt", "dailyGoal", "id", "lastActiveDay", "longestStreak", "streak", "updatedAt", "weeklyGoal", "xp") SELECT "createdAt", "dailyGoal", "id", "lastActiveDay", "longestStreak", "streak", "updatedAt", "weeklyGoal", "xp" FROM "UserStats";
DROP TABLE "UserStats";
ALTER TABLE "new_UserStats" RENAME TO "UserStats";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
