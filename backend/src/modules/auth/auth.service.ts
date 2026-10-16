import { randomUUID } from "node:crypto";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import * as argon2 from "argon2";
import { AppException } from "../../common/exception/app.exception";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { AUTH_ERROR } from "./auth.error";
import type {
  LoginRequest,
  LoginResponse,
  ReissueResponse,
  SignupRequest,
  SignupResponse,
} from "./auth.schema";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService implements OnModuleInit {
  /** 없는 이메일로 로그인할 때도 해시 검증을 수행해 응답 시간으로 계정 존재 여부가 드러나지 않게 한다. */
  private dummyPasswordHash = "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly token: TokenService
  ) {}

  async onModuleInit() {
    this.dummyPasswordHash = await argon2.hash(randomUUID(), {
      type: argon2.argon2id,
    });
  }

  async signup(body: SignupRequest): Promise<SignupResponse> {
    await this.assertNotDuplicated(body.email, body.nickname);

    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
    });

    try {
      await this.prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          nickname: body.nickname,
          role: "MEMBER",
          marketingAgree: body.marketingAgree,
          consents: {
            create: [
              { type: "TERMS", agreed: body.termsAgree },
              { type: "PRIVACY", agreed: body.privacyAgree },
              { type: "MARKETING", agreed: body.marketingAgree },
            ],
          },
        },
      });
    } catch (error) {
      // 사전 중복 검사와 생성 사이에 같은 값으로 가입한 경우 (UNIQUE 위반)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        await this.assertNotDuplicated(body.email, body.nickname);
      }
      throw error;
    }

    return { email: body.email };
  }

  async login(body: LoginRequest): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    const passwordMatches = await argon2.verify(
      user?.passwordHash ?? this.dummyPasswordHash,
      body.password
    );
    if (!user || !passwordMatches) {
      throw new AppException(AUTH_ERROR.INVALID_CREDENTIALS);
    }

    if (user.status === "SUSPENDED") {
      throw new AppException(AUTH_ERROR.ACCOUNT_SUSPENDED);
    }
    if (user.status === "WITHDRAWN") {
      throw new AppException(AUTH_ERROR.ACCOUNT_WITHDRAWN);
    }

    const familyId = randomUUID();
    const [accessJwt, refreshJwt] = await Promise.all([
      this.token.signAccessToken({ sub: user.id, role: user.role }),
      this.token.signRefreshToken({ sub: user.id, fid: familyId }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.token.hashToken(refreshJwt),
        familyId,
        expiresAt: this.token.refreshTokenExpiresAt(),
      },
    });

    return { accessJwt, refreshJwt };
  }

  /**
   * accessJwt 만 재발급한다. 리프레시 토큰은 교체(rotation)하지 않는다 —
   * 현재 프론트 계약(ReissueResponse)이 accessJwt 만 받기 때문 (백엔드 명세서 §10 미결 참고).
   */
  async reissue(refreshJwt: string): Promise<ReissueResponse> {
    const payload = await this.token.verifyRefreshToken(refreshJwt);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.token.hashToken(refreshJwt) },
      include: { user: true },
    });

    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.revokedAt !== null ||
      stored.expiresAt <= new Date() ||
      stored.user.status === "WITHDRAWN"
    ) {
      throw new AppException(AUTH_ERROR.TOKEN_INVALID);
    }

    const accessJwt = await this.token.signAccessToken({
      sub: stored.user.id,
      role: stored.user.role,
    });

    return { accessJwt };
  }

  /** 리프레시 토큰을 폐기한다. 이미 무효이거나 없는 토큰이어도 성공으로 처리한다 (멱등). */
  async logout(refreshJwt: string): Promise<null> {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.token.hashToken(refreshJwt),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return null;
  }

  private async assertNotDuplicated(email: string, nickname: string) {
    const [emailOwner, nicknameOwner] = await Promise.all([
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.user.findUnique({
        where: { nickname },
        select: { id: true },
      }),
    ]);

    if (emailOwner) throw new AppException(AUTH_ERROR.EMAIL_DUPLICATE);
    if (nicknameOwner) throw new AppException(AUTH_ERROR.NICKNAME_DUPLICATE);
  }
}
