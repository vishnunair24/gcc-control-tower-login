-- CreateTable
CREATE TABLE "InfraTask" (
    "id" SERIAL NOT NULL,
    "taskName" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedFinish" TIMESTAMP(3) NOT NULL,
    "dependencies" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL,
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfraTask_pkey" PRIMARY KEY ("id")
);
