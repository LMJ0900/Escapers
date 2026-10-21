"use client";

import { useEffect, useRef } from "react";
import { FiChevronLeft, FiSearch, FiX } from "react-icons/fi";

import { bindClassNames } from "@/util/BindClassName";

import { useSearch } from "../SearchProvider/SearchProvider";
import styles from "./HeaderSearch.module.css";

const cx = bindClassNames(styles);

/** 헤더의 검색 진입점. 돋보기만 있다가 누르면 그 자리에서 둥근 검색창으로 펼쳐진다. */
export default function HeaderSearch() {
  const { isOpen, query, setQuery, open, close } = useSearch();

  const formRef = useRef<HTMLFormElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);

  // 지우기(X)·뒤로가기·Esc 로 접은 경우에만 돋보기로 포커스를 돌려준다.
  // 바깥을 눌러 접힐 땐 사용자가 누른 곳의 포커스를 빼앗지 않는다.
  useEffect(() => {
    if (!isOpen && shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false;
      openButtonRef.current?.focus();
    }
  }, [isOpen]);

  // 입력이 빈 채로 검색창 밖을 누르면 다시 돋보기로 접힌다.
  const isEmpty = query === "";
  useEffect(() => {
    if (!isOpen || !isEmpty) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, isEmpty, close]);

  const handleClear = () => {
    shouldRestoreFocus.current = true;
    close();
  };

  if (!isOpen) {
    return (
      <button
        ref={openButtonRef}
        type="button"
        className={cx("openButton")}
        aria-label="검색 열기"
        onClick={open}
      >
        <FiSearch size={18} aria-hidden />
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className={cx("bar")}
      data-search-open
      role="search"
      aria-label="테마 검색"
      onSubmit={(event) => event.preventDefault()}
    >
      <button
        type="button"
        className={cx("backButton")}
        aria-label="뒤로 가기"
        onClick={handleClear}
      >
        <FiChevronLeft size={20} aria-hidden />
      </button>

      <div className={cx("field")}>
        <FiSearch size={18} className={cx("fieldIcon")} aria-hidden />
        <input
          type="search"
          className={cx("input")}
          value={query}
          placeholder="테마명, 장르, 지점"
          aria-label="테마명, 장르, 지점으로 검색"
          autoComplete="off"
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              handleClear();
            }
          }}
        />
        {query !== "" && (
          <button
            type="button"
            className={cx("clearButton")}
            aria-label="검색어 지우기"
            onClick={handleClear}
          >
            <FiX size={14} aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}
