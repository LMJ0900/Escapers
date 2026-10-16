import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe";
import { AccessTokenGuard, type AuthUser } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UserService } from "./user.service";
import {
  type UpdateEmailRequest,
  updateEmailSchema,
  type UpdateMarketingAgreeRequest,
  updateMarketingAgreeSchema,
  type UpdateNicknameRequest,
  updateNicknameSchema,
  type UpdatePasswordRequest,
  updatePasswordSchema,
} from "./user.schema";

// 모든 /user/* 는 로그인을 전제로 한다 (User 에러 명세서 §2.1).
@Controller("user")
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("getMe")
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.getMe(user.id);
  }

  @Patch("nickname")
  updateNickname(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateNicknameSchema))
    body: UpdateNicknameRequest
  ) {
    return this.userService.updateNickname(user.id, body);
  }

  @Patch("email")
  updateEmail(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateEmailSchema)) body: UpdateEmailRequest
  ) {
    return this.userService.updateEmail(user.id, body);
  }

  @Patch("password")
  updatePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePasswordSchema))
    body: UpdatePasswordRequest
  ) {
    return this.userService.updatePassword(user.id, body);
  }

  @Patch("marketing-agree")
  updateMarketingAgree(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateMarketingAgreeSchema))
    body: UpdateMarketingAgreeRequest
  ) {
    return this.userService.updateMarketingAgree(user.id, body);
  }

  @Delete("me")
  withdraw(@CurrentUser() user: AuthUser) {
    return this.userService.withdraw(user.id);
  }
}
