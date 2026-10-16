import { z } from "zod";

// 환경변수 스키마. 기동 시 검증하고 실패하면 즉시 종료한다 (백엔드 명세서 §9.5).
// 새 모듈이 환경변수를 쓰기 시작할 때 여기에 키를 추가하고 .env.example 도 함께 갱신한다.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  /** 초 단위 */
  JWT_ACCESS_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 15),
  /** 초 단위 */
  JWT_REFRESH_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 14),
  /** 크롤러 식별 UA. 서비스 식별자와 연락처를 넣는다 (§6.3) */
  CRAWLER_USER_AGENT: z
    .string()
    .min(1)
    .default("EscapersBot/0.1 (+mailto:contact@escapers.local)"),
  /** 같은 소스에 보내는 요청 사이의 최소 간격(ms). 기본 3초 (§6.3) */
  CRAWLER_MIN_INTERVAL_MS: z.coerce.number().int().min(1000).default(3000),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`환경변수 검증 실패\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
