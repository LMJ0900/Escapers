import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { GlobalExceptionFilter } from "./common/exception/global-exception.filter";
import { ApiResponseInterceptor } from "./common/response/api-response.interceptor";
import { AppConfigModule } from "./config/config.module";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { ThemeModule } from "./modules/theme/theme.module";
import { ReservationModule } from "./modules/reservation/reservation.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    ThemeModule,
    ReservationModule,
  ],
  providers: [
    // 모든 응답을 { result, data, error } 엔벨로프로 맞춘다 (공통 에러 명세서 §1)
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
