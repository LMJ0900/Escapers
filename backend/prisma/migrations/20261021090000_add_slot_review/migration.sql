-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'DELETED');

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL,
    "price" INTEGER,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "cleared" BOOLEAN NOT NULL,
    "remainingSeconds" INTEGER,
    "hintCount" INTEGER,
    "playerCount" INTEGER,
    "content" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "hasSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "playedAt" TIMESTAMP(3),
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHelpful" (
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("userId","reviewId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Slot_themeId_startsAt_key" ON "Slot"("themeId", "startsAt");

-- CreateIndex
CREATE INDEX "Review_themeId_status_idx" ON "Review"("themeId", "status");

-- CreateIndex
CREATE INDEX "ReviewHelpful_reviewId_idx" ON "ReviewHelpful"("reviewId");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpful" ADD CONSTRAINT "ReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

