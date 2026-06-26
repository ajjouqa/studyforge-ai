-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN "confidence" INTEGER;
ALTER TABLE "Flashcard" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "Flashcard" ADD COLUMN "relatedConcepts" TEXT;
ALTER TABLE "Flashcard" ADD COLUMN "sourcePage" INTEGER;
ALTER TABLE "Flashcard" ADD COLUMN "sourceParagraph" INTEGER;
ALTER TABLE "Flashcard" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDay" TEXT,
    "dailyGoal" INTEGER NOT NULL DEFAULT 20,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 150,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Study plan',
    "examDate" DATETIME NOT NULL,
    "hoursPerDay" REAL NOT NULL DEFAULT 2,
    "studyDays" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyPlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'study',
    "minutes" INTEGER NOT NULL DEFAULT 30,
    "done" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StudyTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MindMap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MindMap_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "readiness" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "mode" TEXT NOT NULL DEFAULT 'chat',
    "level" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChatSession" ("courseId", "createdAt", "id", "title", "updatedAt") SELECT "courseId", "createdAt", "id", "title", "updatedAt" FROM "ChatSession";
DROP TABLE "ChatSession";
ALTER TABLE "new_ChatSession" RENAME TO "ChatSession";
CREATE INDEX "ChatSession_courseId_idx" ON "ChatSession"("courseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "StudyPlan_courseId_idx" ON "StudyPlan"("courseId");

-- CreateIndex
CREATE INDEX "StudyTask_planId_idx" ON "StudyTask"("planId");

-- CreateIndex
CREATE INDEX "MindMap_courseId_idx" ON "MindMap"("courseId");
