/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Customer` MODIFY `registerDate` VARCHAR(191) NOT NULL,
    MODIFY `expireDate` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `image`;
