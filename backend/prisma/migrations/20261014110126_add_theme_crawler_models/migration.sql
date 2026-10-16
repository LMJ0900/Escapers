-- CreateEnum
CREATE TYPE "ThemeGenre" AS ENUM ('HORROR', 'THRILLER', 'MYSTERY', 'SF', 'FANTASY', 'ADVENTURE', 'DRAMA', 'ROMANCE', 'COMEDY', 'IMMERSIVE', 'OUTDOOR', 'ETC');

-- CreateEnum
CREATE TYPE "ThemeActivityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ThemeStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "CrawlEngine" AS ENUM ('CHEERIO', 'PLAYWRIGHT');

-- CreateEnum
CREATE TYPE "CrawlRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genre" "ThemeGenre" NOT NULL,
    "genreRaw" TEXT,
    "difficulty" INTEGER,
    "activityLevel" "ThemeActivityLevel",
    "priceFrom" INTEGER,
    "minPlayers" INTEGER,
    "maxPlayers" INTEGER,
    "playTimeMin" INTEGER,
    "description" TEXT,
    "imageUrl" TEXT,
    "detailUrl" TEXT,
    "status" "ThemeStatus" NOT NULL DEFAULT 'OPEN',
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "sourceId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "engine" "CrawlEngine" NOT NULL,
    "crawlIntervalSec" INTEGER NOT NULL DEFAULT 300,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccessAt" TIMESTAMP(3),
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "CrawlRunStatus" NOT NULL DEFAULT 'RUNNING',
    "stats" JSONB,
    "error" TEXT,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_brandId_name_key" ON "Branch"("brandId", "name");

-- CreateIndex
CREATE INDEX "Theme_genre_idx" ON "Theme"("genre");

-- CreateIndex
CREATE INDEX "Theme_popularityScore_idx" ON "Theme"("popularityScore");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_sourceId_externalId_key" ON "Theme"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Source_adapterKey_key" ON "Source"("adapterKey");

-- CreateIndex
CREATE INDEX "CrawlRun_sourceId_startedAt_idx" ON "CrawlRun"("sourceId", "startedAt");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
