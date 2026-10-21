"use client";

import { useEffect, useState } from "react";

/**
 * 값이 바뀐 뒤 `delay`ms 동안 더 바뀌지 않을 때 따라오는 값.
 * 빈 문자열은 기다리지 않고 바로 반영해서, 입력을 지웠다 다시 쓸 때 이전 값이 남아 있지 않게 한다.
 */
export function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(value),
      value === "" ? 0 : delay
    );
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
