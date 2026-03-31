-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "reminderDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReminderLog_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_actionId_reminderType_reminderDate_key" ON "ReminderLog"("actionId", "reminderType", "reminderDate");

-- CreateIndex
CREATE INDEX "ReminderLog_reminderDate_idx" ON "ReminderLog"("reminderDate");
