import { Body, Controller, Post } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe";
import { AuthService } from "./auth.service";
import {
  type LoginRequest,
  loginSchema,
  type RefreshJwtRequest,
  refreshJwtSchema,
  type SignupRequest,
  signupSchema,
} from "./auth.schema";

// 프론트 계약(MSW 목)이 모두 200 을 기대하므로 POST 기본값 201 대신 200 으로 응답한다.
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body(new ZodValidationPipe(signupSchema)) body: SignupRequest) {
    return this.authService.signup(body);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginRequest) {
    return this.authService.login(body);
  }

  @Post("reissue")
  reissue(
    @Body(new ZodValidationPipe(refreshJwtSchema)) body: RefreshJwtRequest
  ) {
    return this.authService.reissue(body.refreshJwt);
  }

  @Post("logout")
  logout(
    @Body(new ZodValidationPipe(refreshJwtSchema)) body: RefreshJwtRequest
  ) {
    return this.authService.logout(body.refreshJwt);
  }
}
