/*
  Warnings:

  - Added the required column `userId` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Device` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add userId columns as nullable first
ALTER TABLE "Device" ADD COLUMN "userId" TEXT;
ALTER TABLE "Alert" ADD COLUMN "userId" TEXT;

-- Step 2: Assign existing devices and alerts to the first user
UPDATE "Device" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
UPDATE "Alert" SET "userId" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);

-- Step 3: Make userId NOT NULL
ALTER TABLE "Device" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Alert" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
