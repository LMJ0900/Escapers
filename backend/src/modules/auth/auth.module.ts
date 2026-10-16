import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AccessTokenGuard } from "./access-token.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OptionalAccessTokenGuard } from "./optional-access-token.guard";
import { TokenService } from "./token.service";

@Module({
  // 서명 키는 토큰 종류별로 TokenService 에서 지정한다.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    AccessTokenGuard,
    OptionalAccessTokenGuard,
  ],
  exports: [TokenService, AccessTokenGuard, OptionalAccessTokenGuard],
})
export class AuthModule {}
