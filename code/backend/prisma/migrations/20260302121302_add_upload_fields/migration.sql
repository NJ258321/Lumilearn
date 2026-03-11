/*
  Warnings:

  - You are about to drop the column `data` on the `TimeMark` table. All the data in the column will be lost.
  - Added the required column `title` to the `StudyRecord` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDING',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyRecord_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudyRecord" ("audioUrl", "chapterId", "courseId", "createdAt", "date", "duration", "id", "notes") SELECT "audioUrl", "chapterId", "courseId", "createdAt", "date", "duration", "id", "notes" FROM "StudyRecord";
DROP TABLE "StudyRecord";
ALTER TABLE "new_StudyRecord" RENAME TO "StudyRecord";
CREATE INDEX "StudyRecord_courseId_idx" ON "StudyRecord"("courseId");
CREATE INDEX "StudyRecord_chapterId_idx" ON "StudyRecord"("chapterId");
CREATE INDEX "StudyRecord_date_idx" ON "StudyRecord"("date");
CREATE INDEX "StudyRecord_status_idx" ON "StudyRecord"("status");
CREATE TABLE "new_TimeMark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyRecordId" TEXT NOT NULL,
    "knowledgePointId" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "pptPage" INTEGER,
    "content" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeMark_studyRecordId_fkey" FOREIGN KEY ("studyRecordId") REFERENCES "StudyRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeMark_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TimeMark" ("createdAt", "id", "knowledgePointId", "studyRecordId", "timestamp", "type") SELECT "createdAt", "id", "knowledgePointId", "studyRecordId", "timestamp", "type" FROM "TimeMark";
DROP TABLE "TimeMark";
ALTER TABLE "new_TimeMark" RENAME TO "TimeMark";
CREATE INDEX "TimeMark_studyRecordId_idx" ON "TimeMark"("studyRecordId");
CREATE INDEX "TimeMark_knowledgePointId_idx" ON "TimeMark"("knowledgePointId");
CREATE INDEX "TimeMark_timestamp_idx" ON "TimeMark"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
