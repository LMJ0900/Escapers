import { createHash, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Env } from "../../config/env";
import { AppException } from "../../common/exception/app.exception";
import type { UserRole } from "../../generated/prisma/enums";
import { AUTH_ERROR } from "./auth.error";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  /** 같은 로그인에서 파생된 토큰 계열 ID (RefreshToken.familyId) */
  fid: string;
}

/** JWT 발급 · 검증. 액세스/리프레시 토큰은 서로 다른 키로 서명한다. */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_ACCESS_SECRET"),
      expiresIn: this.config.get("JWT_ACCESS_TTL"),
    });
  }

  /** jti 로 매번 다른 토큰을 만들어 tokenHash 가 겹치지 않게 한다. */
  signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get("JWT_REFRESH_SECRET"),
      expiresIn: this.config.get("JWT_REFRESH_TTL"),
      jwtid: randomUUID(),
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.verify<AccessTokenPayload>(
      token,
      this.config.get("JWT_ACCESS_SECRET")
    );
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.verify<RefreshTokenPayload>(
      token,
      this.config.get("JWT_REFRESH_SECRET")
    );
  }

  refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.config.get("JWT_REFRESH_TTL") * 1000);
  }

  /** DB 조회용 결정적 해시. 리프레시 토큰은 원문 대신 이 값만 저장한다. */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** 서명·만료를 검증한다. 만료면 AUTH_TOKEN_EXPIRED, 그 외 실패는 AUTH_TOKEN_INVALID. */
  private async verify<TPayload extends object>(
    token: string,
    secret: string
  ): Promise<TPayload> {
    try {
      return await this.jwt.verifyAsync<TPayload>(token, { secret });
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new AppException(AUTH_ERROR.TOKEN_EXPIRED);
      }
      throw new AppException(AUTH_ERROR.TOKEN_INVALID);
    }
  }
}
