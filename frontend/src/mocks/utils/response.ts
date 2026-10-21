import { HttpResponse } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";

/** 성공 엔벨로프({ result: "SUCCESS", data })로 감싼 목 응답. */
export const ok = <TData>(data: TData, status = 200) =>
  HttpResponse.json<ApiResponse<TData>>(
    { result: "SUCCESS", data, error: null },
    { status }
  );

/** 실패 엔벨로프({ result: "ERROR", error })로 감싼 목 응답. HTTP 상태는 `error.status` 를 따른다. */
export const fail = <TData = null>(error: ApiErrorResponse) =>
  HttpResponse.json<ApiResponse<TData>>(
    { result: "ERROR", data: null, error },
    { status: error.status }
  );
