-- CreateTable
CREATE TABLE "ThemeLike" (
    "userId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeLike_pkey" PRIMARY KEY ("userId","themeId")
);

-- CreateIndex
CREATE INDEX "ThemeLike_themeId_createdAt_idx" ON "ThemeLike"("themeId", "createdAt");

-- AddForeignKey
ALTER TABLE "ThemeLike" ADD CONSTRAINT "ThemeLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeLike" ADD CONSTRAINT "ThemeLike_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
