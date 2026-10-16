import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { AppException } from "../../common/exception/app.exception";
import {
  COMMON_ERROR,
  type ErrorSpec,
} from "../../common/exception/error-code";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import { USER_ERROR } from "./user.error";
import type {
  MeResponse,
  UpdateEmailRequest,
  UpdateEmailResponse,
  UpdateMarketingAgreeRequest,
  UpdateNicknameRequest,
  UpdatePasswordRequest,
} from "./user.schema";

const ME_SELECT = {
  id: true,
  role: true,
  email: true,
  nickname: true,
  marketingAgree: true,
} as const satisfies Prisma.UserSelect;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_SELECT,
    });
    // AccessTokenGuard 가 방금 존재를 확인했으므로 정상 흐름에서는 일어나지 않는다.
    if (!user) throw new AppException(COMMON_ERROR.NOT_FOUND);
    return user;
  }

  /** 현재 닉네임과 같으면 중복 검사 없이 그대로 성공한다 (User 에러 명세서 §3.2). */
  async updateNickname(
    userId: string,
    body: UpdateNicknameRequest
  ): Promise<MeResponse> {
    const owner = await this.prisma.user.findUnique({
      where: { nickname: body.nickname },
      select: { id: true },
    });
    if (owner?.id === userId) return this.getMe(userId);
    if (owner) throw new AppException(USER_ERROR.NICKNAME_DUPLICATE);

    return this.updateUnique(USER_ERROR.NICKNAME_DUPLICATE, () =>
      this.prisma.user.update({
        where: { id: userId },
        data: { nickname: body.nickname },
        select: ME_SELECT,
      })
    );
  }

  /**
   * 즉시 전환한다 (이메일 재인증은 미결 — User 에러 명세서 §5-1).
   * 토큰 subject 는 user id 라 기존 토큰은 계속 유효하지만, 프론트가 성공 후 세션을 정리하고 재로그인시킨다.
   */
  async updateEmail(
    userId: string,
    body: UpdateEmailRequest
  ): Promise<UpdateEmailResponse> {
    const owner = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (owner?.id === userId) return { email: body.email };
    if (owner) throw new AppException(USER_ERROR.EMAIL_DUPLICATE);

    return this.updateUnique(USER_ERROR.EMAIL_DUPLICATE, () =>
      this.prisma.user.update({
        where: { id: userId },
        data: { email: body.email },
        select: { email: true },
      })
    );
  }

  /** 성공하면 해당 사용자의 refreshToken 을 모두 폐기한다 — 다른 기기 로그아웃 (백엔드 명세서 §4.2). */
  async updatePassword(
    userId: string,
    body: UpdatePasswordRequest
  ): Promise<null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const matches = await argon2.verify(
      user.passwordHash,
      body.currentPassword
    );
    if (!matches) throw new AppException(USER_ERROR.CURRENT_PASSWORD_MISMATCH);

    const passwordHash = await argon2.hash(body.newPassword, {
      type: argon2.argon2id,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.revokeAllRefreshTokens(userId),
    ]);

    return null;
  }

  /**
   * 프론트 계약(UserMutation.patchMarketingAgree · MSW 목)이 최신 본인 정보를 기대하므로 getMe 응답을 돌려준다.
   * 값이 바뀔 때만 UserConsent 에 동의/철회 이력을 남긴다.
   */
  async updateMarketingAgree(
    userId: string,
    body: UpdateMarketingAgreeRequest
  ): Promise<MeResponse> {
    const me = await this.getMe(userId);
    if (me.marketingAgree === body.marketingAgree) return me;

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { marketingAgree: body.marketingAgree },
        select: ME_SELECT,
      }),
      this.prisma.userConsent.create({
        data: { userId, type: "MARKETING", agreed: body.marketingAgree },
      }),
    ]);

    return updated;
  }

  /**
   * 탈퇴: status = WITHDRAWN, 이메일·닉네임 익명화, refreshToken 폐기 (백엔드 명세서 §4.2).
   * 익명화로 원래 이메일·닉네임의 UNIQUE 를 풀어 재가입할 수 있게 한다.
   * TODO: Watch 모델이 추가되면 감시 삭제도 같은 트랜잭션에 넣는다.
   */
  async withdraw(userId: string): Promise<null> {
    const anonymized = `withdrawn-${userId}`;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: "WITHDRAWN",
          email: `${anonymized}@withdrawn.invalid`,
          nickname: anonymized,
          marketingAgree: false,
        },
      }),
      this.revokeAllRefreshTokens(userId),
    ]);

    return null;
  }

  private revokeAllRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** 사전 중복 검사와 갱신 사이에 다른 계정이 같은 값을 가져간 경우 (UNIQUE 위반) 도메인 에러로 바꾼다. */
  private async updateUnique<T>(
    duplicateError: ErrorSpec,
    update: () => Promise<T>
  ): Promise<T> {
    try {
      return await update();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppException(duplicateError);
      }
      throw error;
    }
  }
}
