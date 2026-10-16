import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { AppException } from "./app.exception";
import { COMMON_ERROR, type ErrorSpec } from "./error-code";
import type { ApiResponse } from "../response/api-response";

/**
 * 모든 예외를 실패 엔벨로프로 변환한다 (공통 에러 명세서 §1).
 * HTTP status 와 error.status 를 항상 일치시키고, 5xx 에는 내부 메시지를 노출하지 않는다.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const error = this.toErrorSpec(exception);

    if (error.status >= 500) {
      this.logger.error(exception);
    }

    const body: ApiResponse<null> = { result: "ERROR", data: null, error };
    void reply.status(error.status).send(body);
  }

  private toErrorSpec(exception: unknown): ErrorSpec {
    if (exception instanceof AppException) {
      return {
        code: exception.code,
        message: exception.message,
        status: exception.status,
      };
    }

    // Nest/Fastify 가 던지는 HTTP 예외 (없는 경로, 본문 JSON 파싱 실패 등)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 404) return COMMON_ERROR.NOT_FOUND;
      if (status === 400) return COMMON_ERROR.VALIDATION_FAILED;
      if (status < 500) {
        return { code: `HTTP_${status}`, message: exception.message, status };
      }
    }

    return COMMON_ERROR.INTERNAL_ERROR;
  }
}
