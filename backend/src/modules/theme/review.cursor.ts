import { z } from "zod";
import { AppException } from "../../common/exception/app.exception";
import { COMMON_ERROR } from "../../common/exception/error-code";
import type { Prisma } from "../../generated/prisma/client";
import { THEME_REVIEW_SORT_OPTIONS, type ThemeReviewSort } from "./theme.schema";

// 테마 후기 커서 페이지네이션. theme.cursor.ts 와 같은 방식의 불투명 문자열이다.
// 정렬은 항상 (정렬 키, createdAt DESC, id ASC) — 같은 점수면 최신 후기가 먼저 온다 (목 동작과 같다).
// NEWEST 는 정렬 키 없이 (createdAt DESC, id ASC) 만 쓴다.

type SortField = "helpfulCount" | "rating";

const SORT_SPEC: Record<
  ThemeReviewSort,
  { field: SortField; direction: Prisma.SortOrder } | null
> = {
  HELPFUL: { field: "helpfulCount", direction: "desc" },
  NEWEST: null,
  RATING_DESC: { field: "rating", direction: "desc" },
  RATING_ASC: { field: "rating", direction: "asc" },
};

const cursorSchema = z.object({
  /** 커서를 만든 정렬. 정렬이 바뀐 요청에 이전 커서가 오면 거부한다. */
  sort: z.enum(THEME_REVIEW_SORT_OPTIONS),
  /** 정렬 키 값. NEWEST 면 null */
  value: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
  id: z.string().min(1),
});
type ReviewCursor = z.infer<typeof cursorSchema>;

export function reviewOrderBy(
  sort: ThemeReviewSort
): Prisma.ReviewOrderByWithRelationInput[] {
  const spec = SORT_SPEC[sort];
  return [
    ...(spec ? [{ [spec.field]: spec.direction }] : []),
    { createdAt: "desc" },
    { id: "asc" },
  ];
}

/** 정렬 순서에서 커서 행 다음에 오는 행들의 조건. */
export function reviewAfterCursor(
  sort: ThemeReviewSort,
  encoded: string
): Prisma.ReviewWhereInput {
  const { value, createdAt, id } = decodeCursor(sort, encoded);
  const afterCreatedAt: Prisma.ReviewWhereInput[] = [
    { createdAt: { lt: createdAt } },
    { createdAt, id: { gt: id } },
  ];

  const spec = SORT_SPEC[sort];
  if (!spec) return { OR: afterCreatedAt };

  const beyond = spec.direction === "asc" ? "gt" : "lt";
  return {
    OR: [
      { [spec.field]: { [beyond]: value } },
      ...afterCreatedAt.map((where) => ({ [spec.field]: value, ...where })),
    ],
  };
}

export function encodeReviewCursor(
  sort: ThemeReviewSort,
  row: { id: string; createdAt: Date } & Record<SortField, number>
): string {
  const spec = SORT_SPEC[sort];
  const cursor: ReviewCursor = {
    sort,
    value: spec ? row[spec.field] : null,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
  };
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** 형식이 깨졌거나 다른 정렬에서 만든 커서면 400 VALIDATION_FAILED. */
function decodeCursor(
  sort: ThemeReviewSort,
  encoded: string
): { value: number | null; createdAt: Date; id: string } {
  let parsed: ReviewCursor | undefined;
  try {
    parsed = cursorSchema.parse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    );
  } catch {
    parsed = undefined;
  }
  if (
    !parsed ||
    parsed.sort !== sort ||
    (SORT_SPEC[sort] === null) !== (parsed.value === null)
  ) {
    throw new AppException(COMMON_ERROR.VALIDATION_FAILED);
  }

  return {
    value: parsed.value,
    createdAt: new Date(parsed.createdAt),
    id: parsed.id,
  };
}
