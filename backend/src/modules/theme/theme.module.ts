import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ThemeController } from "./theme.controller";
import { ThemeService } from "./theme.service";

@Module({
  // AccessTokenGuard · OptionalAccessTokenGuard
  imports: [AuthModule],
  controllers: [ThemeController],
  providers: [ThemeService],
})
export class ThemeModule {}
