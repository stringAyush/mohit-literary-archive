-- CreateTable
CREATE TABLE "PhotoPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "bookTitle" TEXT,
    "bookAuthor" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagramUrl" TEXT,
    "photographyDate" DATE,
    "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "hash" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoPost_slug_key" ON "PhotoPost"("slug");

-- CreateIndex
CREATE INDEX "PhotoPost_isPublished_publishedAt_idx" ON "PhotoPost"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "PhotoPost_category_idx" ON "PhotoPost"("category");

-- CreateIndex
CREATE INDEX "PhotoPost_featured_idx" ON "PhotoPost"("featured");

-- CreateIndex
CREATE INDEX "PhotoPost_sortOrder_idx" ON "PhotoPost"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoImage_hash_key" ON "PhotoImage"("hash");

-- CreateIndex
CREATE INDEX "PhotoImage_postId_sortOrder_idx" ON "PhotoImage"("postId", "sortOrder");

-- CreateIndex
CREATE INDEX "PhotoImage_hash_idx" ON "PhotoImage"("hash");

-- AddForeignKey
ALTER TABLE "PhotoImage" ADD CONSTRAINT "PhotoImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PhotoPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
