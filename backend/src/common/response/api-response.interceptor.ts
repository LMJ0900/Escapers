import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type { ApiResponse } from "./api-response";

/** 컨트롤러 반환값을 성공 엔벨로프로 감싼다. 반환값이 없으면 data 는 null. */
@Injectable()
export class ApiResponseInterceptor<TData> implements NestInterceptor<
  TData,
  ApiResponse<TData | null>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<TData>
  ): Observable<ApiResponse<TData | null>> {
    return next
      .handle()
      .pipe(
        map((data) => ({ result: "SUCCESS", data: data ?? null, error: null }))
      );
  }
}
