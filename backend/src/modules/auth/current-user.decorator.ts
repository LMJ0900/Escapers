import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest, AuthUser } from "./access-token.guard";

/** AccessTokenGuard 가 붙인 인증 사용자. 가드가 적용된 핸들러에서만 쓴다. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user
);
