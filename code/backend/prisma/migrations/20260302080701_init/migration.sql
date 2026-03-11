-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STUDYING',
    "type" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "examDate" DATETIME,
    "reviewStartDate" DATETIME,
    "targetGrade" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEED_REVIEW',
    "importance" INTEGER NOT NULL DEFAULT 5,
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgePoint_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TimeMark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyRecordId" TEXT NOT NULL,
    "knowledgePointId" TEXT,
    "type" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeMark_studyRecordId_fkey" FOREIGN KEY ("studyRecordId") REFERENCES "StudyRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeMark_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedDuration" INTEGER NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamTask_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mistake_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mistake_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Course_status_idx" ON "Course"("status");

-- CreateIndex
CREATE INDEX "Course_examDate_idx" ON "Course"("examDate");

-- CreateIndex
CREATE INDEX "Course_createdAt_idx" ON "Course"("createdAt");

-- CreateIndex
CREATE INDEX "Chapter_courseId_idx" ON "Chapter"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_courseId_order_key" ON "Chapter"("courseId", "order");

-- CreateIndex
CREATE INDEX "KnowledgePoint_chapterId_idx" ON "KnowledgePoint"("chapterId");

-- CreateIndex
CREATE INDEX "KnowledgePoint_status_idx" ON "KnowledgePoint"("status");

-- CreateIndex
CREATE INDEX "StudyRecord_courseId_idx" ON "StudyRecord"("courseId");

-- CreateIndex
CREATE INDEX "StudyRecord_date_idx" ON "StudyRecord"("date");

-- CreateIndex
CREATE INDEX "TimeMark_studyRecordId_idx" ON "TimeMark"("studyRecordId");

-- CreateIndex
CREATE INDEX "TimeMark_knowledgePointId_idx" ON "TimeMark"("knowledgePointId");

-- CreateIndex
CREATE INDEX "ExamTask_courseId_idx" ON "ExamTask"("courseId");

-- CreateIndex
CREATE INDEX "ExamTask_scheduledDate_idx" ON "ExamTask"("scheduledDate");

-- CreateIndex
CREATE INDEX "ExamTask_status_idx" ON "ExamTask"("status");

-- CreateIndex
CREATE INDEX "Mistake_courseId_idx" ON "Mistake"("courseId");

-- CreateIndex
CREATE INDEX "Mistake_knowledgePointId_idx" ON "Mistake"("knowledgePointId");

-- CreateIndex
CREATE INDEX "Mistake_createdAt_idx" ON "Mistake"("createdAt");
