import { defineConfig } from "prisma/config";

// Nest 앱(@nestjs/config)과 같은 backend/.env 를 읽는다. 없으면(CI 등) 환경변수를 그대로 쓴다.
try {
  process.loadEnvFile();
} catch {
  // .env 파일이 없으면 무시
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
