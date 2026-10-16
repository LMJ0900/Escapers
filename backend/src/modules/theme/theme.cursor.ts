import { z } from "zod";
import { AppException } from "../../common/exception/app.exception";
import { COMMON_ERROR } from "../../common/exception/error-code";
import type { Prisma } from "../../generated/prisma/client";
import { THEME_SORT_OPTIONS, type ThemeSortOption } from "./theme.schema";

// 테마 목록 커서 페이지네이션 (백엔드 명세서 §3.4).
// 정렬 키 + id 를 base64url 로 인코딩한 불투명 문자열. 정렬은 항상 (정렬 키, id ASC) 이고,
// null 인 정렬 키(가격 · 난이도 미상)는 방향과 무관하게 맨 뒤로 보낸다.

type SortField = "popularityScore" | "createdAt" | "priceFrom" | "difficulty";

interface SortSpec {
  field: SortField;
  direction: Prisma.SortOrder;
  nullable: boolean;
}

const SORT_SPEC: Record<ThemeSortOption, SortSpec> = {
  POPULAR: { field: "popularityScore", direction: "desc", nullable: false },
  NEWEST: { field: "createdAt", direction: "desc", nullable: false },
  PRICE_ASC: { field: "priceFrom", direction: "asc", nullable: true },
  PRICE_DESC: { field: "priceFrom", direction: "desc", nullable: true },
  DIFFICULTY_DESC: { field: "difficulty", direction: "desc", nullable: true },
  DIFFICULTY_ASC: { field: "difficulty", direction: "asc", nullable: true },
};

const cursorSchema = z.object({
  /** 커서를 만든 정렬. 정렬이 바뀐 요청에 이전 커서가 오면 거부한다. */
  sort: z.enum(THEME_SORT_OPTIONS),
  /** 정렬 키 값. createdAt 은 ISO 문자열 */
  value: z.union([z.number(), z.string(), z.null()]),
  id: z.string().min(1),
});
type ThemeCursor = z.infer<typeof cursorSchema>;

type SortValue = number | Date | null;

export function themeOrderBy(
  sort: ThemeSortOption
): Prisma.ThemeOrderByWithRelationInput[] {
  const { field, direction, nullable } = SORT_SPEC[sort];
  const key = nullable ? { sort: direction, nulls: "last" as const } : direction;
  return [{ [field]: key }, { id: "asc" }];
}

/** 정렬 순서에서 커서 행 다음에 오는 행들의 조건. */
export function themeAfterCursor(
  sort: ThemeSortOption,
  encoded: string
): Prisma.ThemeWhereInput {
  const { value, id } = decodeCursor(sort, encoded);
  const { field, direction, nullable } = SORT_SPEC[sort];

  // null 구간은 맨 뒤라 같은 null 안에서 id 로만 이어간다.
  if (value === null) return { [field]: null, id: { gt: id } };

  const beyond = direction === "asc" ? "gt" : "lt";
  return {
    OR: [
      { [field]: { [beyond]: value } },
      { [field]: value, id: { gt: id } },
      ...(nullable ? [{ [field]: null }] : []),
    ],
  };
}

export function encodeThemeCursor(
  sort: ThemeSortOption,
  row: { id: string } & Record<SortField, SortValue>
): string {
  const raw = row[SORT_SPEC[sort].field];
  const cursor: ThemeCursor = {
    sort,
    value: raw instanceof Date ? raw.toISOString() : raw,
    id: row.id,
  };
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

/** 형식이 깨졌거나 다른 정렬에서 만든 커서면 400 VALIDATION_FAILED. */
function decodeCursor(
  sort: ThemeSortOption,
  encoded: string
): { value: SortValue; id: string } {
  let parsed: ThemeCursor | undefined;
  try {
    parsed = cursorSchema.parse(
      JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"))
    );
  } catch {
    parsed = undefined;
  }
  if (!parsed || parsed.sort !== sort) {
    throw new AppException(COMMON_ERROR.VALIDATION_FAILED);
  }

  const { value, id } = parsed;
  if (SORT_SPEC[sort].field === "createdAt") {
    const date = typeof value === "string" ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) return { value: date, id };
  } else if (typeof value !== "string") {
    return { value, id };
  }
  throw new AppException(COMMON_ERROR.VALIDATION_FAILED);
}
