import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AppException } from "../../common/exception/app.exception";
import { PrismaService } from "../../infra/prisma/prisma.service";
import type { UserRole } from "../../generated/prisma/enums";
import { AUTH_ERROR } from "./auth.error";
import { TokenService } from "./token.service";

/** 가드를 통과한 요청에 붙는 인증 사용자 정보. */
export interface AuthUser {
  id: string;
  role: UserRole;
}

export type AuthenticatedRequest = FastifyRequest & { user: AuthUser };

/**
 * `Authorization: Bearer <accessJwt>` 를 검증한다 (백엔드 명세서 §3.3).
 * 토큰이 유효해도 정지·탈퇴 계정이면 403 으로 막는다 — 상태 변경이 다음 요청부터 바로 반영되도록 매번 DB 를 조회한다.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly token: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser }>();

    const accessJwt = this.extractBearerToken(request);
    if (!accessJwt) throw new AppException(AUTH_ERROR.TOKEN_MISSING);

    request.user = await this.authenticate(accessJwt);
    return true;
  }

  protected async authenticate(accessJwt: string): Promise<AuthUser> {
    const payload = await this.token.verifyAccessToken(accessJwt);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    // 서명은 유효하지만 가리키는 계정이 없으면 위조 토큰과 같이 취급한다 (User 에러 명세서 §3.1 케이스 노트)
    if (!user) throw new AppException(AUTH_ERROR.TOKEN_INVALID);
    if (user.status === "SUSPENDED") {
      throw new AppException(AUTH_ERROR.ACCOUNT_SUSPENDED);
    }
    if (user.status === "WITHDRAWN") {
      throw new AppException(AUTH_ERROR.ACCOUNT_WITHDRAWN);
    }

    // role 은 토큰 발급 이후 바뀌었을 수 있으므로 DB 값을 쓴다.
    return { id: user.id, role: user.role };
  }

  protected extractBearerToken(request: FastifyRequest): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice("Bearer ".length).trim() || null;
  }
}
