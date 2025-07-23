/*
  Warnings:

  - A unique constraint covering the columns `[passphrase]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auth_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `Confession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auth_token` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avatar_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passphrase` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_nickname_key";

-- AlterTable
ALTER TABLE "Confession" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "auth_token" TEXT NOT NULL,
ADD COLUMN     "avatar_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "passphrase" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "emoji_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "confession_id" INTEGER NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewHistory" (
    "user_id" INTEGER NOT NULL,
    "confession_id" INTEGER NOT NULL,

    CONSTRAINT "ViewHistory_pkey" PRIMARY KEY ("user_id","confession_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_user_id_confession_id_key" ON "Reaction"("user_id", "confession_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_passphrase_key" ON "User"("passphrase");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_token_key" ON "User"("auth_token");

-- AddForeignKey
ALTER TABLE "Confession" ADD CONSTRAINT "Confession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_confession_id_fkey" FOREIGN KEY ("confession_id") REFERENCES "Confession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_confession_id_fkey" FOREIGN KEY ("confession_id") REFERENCES "Confession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
