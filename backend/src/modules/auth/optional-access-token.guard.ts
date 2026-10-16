import { type ExecutionContext, Injectable } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AccessTokenGuard, type AuthUser } from "./access-token.guard";

/**
 * 선택 인증 (백엔드 명세서 §3.3). 토큰이 없으면 비로그인으로 통과시키고(request.user 없음),
 * 토큰이 있으면 AccessTokenGuard 와 똑같이 검증한다 — 유효하지 않으면 401, 정지·탈퇴면 403.
 */
@Injectable()
export class OptionalAccessTokenGuard extends AccessTokenGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser }>();

    const accessJwt = this.extractBearerToken(request);
    if (accessJwt) request.user = await this.authenticate(accessJwt);
    return true;
  }
}
