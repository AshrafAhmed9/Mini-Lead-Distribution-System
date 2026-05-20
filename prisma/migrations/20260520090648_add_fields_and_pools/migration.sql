/*
  Warnings:

  - The primary key for the `RoundRobinState` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RoundRobinState` table. All the data in the column will be lost.
  - Added the required column `service_id` to the `RoundRobinState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "city" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "RoundRobinState" DROP CONSTRAINT "RoundRobinState_pkey",
DROP COLUMN "id",
ADD COLUMN     "service_id" INTEGER NOT NULL,
ADD CONSTRAINT "RoundRobinState_pkey" PRIMARY KEY ("service_id");
