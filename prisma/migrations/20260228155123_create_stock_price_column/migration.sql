/*
  Warnings:

  - You are about to drop the column `name` on the `Stock` table. All the data in the column will be lost.
  - Added the required column `price` to the `Stock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "name",
ADD COLUMN     "price" DECIMAL(65,30) NOT NULL;
