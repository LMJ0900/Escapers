import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe";
import { AccessTokenGuard, type AuthUser } from "../auth/access-token.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { OptionalAccessTokenGuard } from "../auth/optional-access-token.guard";
import { ThemeService } from "./theme.service";
import {
  type GetThemesQuery,
  getThemesQuerySchema,
  type PutThemeLikeRequest,
  putThemeLikeSchema,
} from "./theme.schema";

// 목록 · 컬렉션은 공개 API 지만 로그인 상태면 liked 를 채운다 (선택 인증, 백엔드 명세서 §3.3).
@Controller("theme")
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @UseGuards(OptionalAccessTokenGuard)
  getThemes(
    @CurrentUser() user: AuthUser | undefined,
    @Query(new ZodValidationPipe(getThemesQuerySchema)) query: GetThemesQuery
  ) {
    return this.themeService.getThemes(query, user?.id);
  }

  @Get("collections/:type")
  @UseGuards(OptionalAccessTokenGuard)
  getCollection(
    @CurrentUser() user: AuthUser | undefined,
    @Param("type") type: string
  ) {
    return this.themeService.getCollection(type, user?.id);
  }

  @Put(":id/like")
  @UseGuards(AccessTokenGuard)
  putLike(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(putThemeLikeSchema)) body: PutThemeLikeRequest
  ) {
    return this.themeService.putLike(user.id, id, body);
  }
}
