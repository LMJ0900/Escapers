import { Injectable, type PipeTransform } from "@nestjs/common";
import type { z } from "zod";
import { AppException } from "../exception/app.exception";
import { COMMON_ERROR } from "../exception/error-code";

/** 요청 값을 zod 스키마로 검증한다. 실패하면 400 VALIDATION_FAILED. */
@Injectable()
export class ZodValidationPipe<
  TSchema extends z.ZodType,
> implements PipeTransform<unknown, z.output<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppException(COMMON_ERROR.VALIDATION_FAILED);
    }
    return result.data;
  }
}
