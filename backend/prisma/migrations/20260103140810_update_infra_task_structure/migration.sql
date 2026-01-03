/*
  Warnings:

  - You are about to drop the column `dependencies` on the `InfraTask` table. All the data in the column will be lost.
  - You are about to drop the column `durationDays` on the `InfraTask` table. All the data in the column will be lost.
  - You are about to drop the column `plannedFinish` on the `InfraTask` table. All the data in the column will be lost.
  - You are about to drop the column `plannedStart` on the `InfraTask` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `InfraTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `infraPhase` to the `InfraTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `InfraTask` table without a default value. This is not possible if the table is not empty.
  - Made the column `owner` on table `InfraTask` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "InfraTask" DROP COLUMN "dependencies",
DROP COLUMN "durationDays",
DROP COLUMN "plannedFinish",
DROP COLUMN "plannedStart",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "infraPhase" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "owner" SET NOT NULL,
ALTER COLUMN "percentComplete" DROP DEFAULT;
