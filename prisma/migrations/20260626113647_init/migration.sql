-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filePath" TEXT,
    "mimeType" TEXT,
    "sourceUrl" TEXT,
    "rawInput" TEXT,
    "extractedText" TEXT,
    "wordCount" INTEGER,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    CONSTRAINT "Chunk_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "materialId" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'material',
    "content" TEXT NOT NULL DEFAULT '',
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Summary_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Summary_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deck_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "materialId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "hint" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewed" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Flashcard_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flashcardId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "prevInterval" INTEGER NOT NULL,
    "newInterval" INTEGER NOT NULL,
    "prevEase" REAL NOT NULL,
    "newEase" REAL NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewLog_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "materialId" TEXT,
    "payload" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "Job_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Material_courseId_idx" ON "Material"("courseId");

-- CreateIndex
CREATE INDEX "Material_status_idx" ON "Material"("status");

-- CreateIndex
CREATE INDEX "Chunk_materialId_idx" ON "Chunk"("materialId");

-- CreateIndex
CREATE INDEX "Summary_courseId_idx" ON "Summary"("courseId");

-- CreateIndex
CREATE INDEX "Summary_materialId_idx" ON "Summary"("materialId");

-- CreateIndex
CREATE INDEX "Deck_courseId_idx" ON "Deck"("courseId");

-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "Flashcard_dueDate_idx" ON "Flashcard"("dueDate");

-- CreateIndex
CREATE INDEX "ReviewLog_flashcardId_idx" ON "ReviewLog"("flashcardId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_type_idx" ON "Job"("type");
