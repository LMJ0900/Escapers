"use client";

import { usePathname } from "next/navigation";
import { Activity, type MouseEvent, type ReactNode } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { bindClassNames } from "@/util/BindClassName";

import { useSearch } from "../SearchProvider/SearchProvider";
import SearchResults from "./_components/SearchResults/SearchResults";
import styles from "./SearchScreen.module.css";

const cx = bindClassNames(styles);

const SEARCH_DEBOUNCE_MS = 250;

type SearchScreenProps = {
  /** 검색하기 전에 보던 페이지 */
  children: ReactNode;
};

/**
 * 검색어가 있으면 본문(children)을 검색 결과 화면으로 바꿔 보여준다.
 * 본문은 언마운트하지 않고 숨기기만 해서, 검색을 지우면 필터·불러온 목록이 그대로 돌아온다.
 * 모바일에서는 검색창을 여는 순간부터 화면 전체를 덮는 검색 화면이 된다.
 */
export default function SearchScreen({ children }: SearchScreenProps) {
  const { isOpen, isSearching, query, close } = useSearch();
  const pathname = usePathname();

  const keyword = query.trim().replace(/\s+/g, " ");
  const debouncedKeyword = useDebouncedValue(keyword, SEARCH_DEBOUNCE_MS);

  // 같은 페이지로 가는 링크(예: /themes 에서 장르 바로가기)는 경로가 바뀌지 않아
  // SearchProvider 가 닫아주지 못하므로, 여기서 검색을 닫는다.
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    if (anchor && new URL(anchor.href).pathname === pathname) close();
  };

  return (
    <>
      <Activity mode={isSearching ? "hidden" : "visible"}>{children}</Activity>

      {isOpen && (
        <div
          className={cx("screen", { screenActive: isSearching })}
          onClick={handleClick}
        >
          {isSearching ? (
            <SearchResults
              keyword={debouncedKeyword}
              isTyping={keyword !== debouncedKeyword}
            />
          ) : (
            <p className={cx("hint")}>테마명, 장르, 지점으로 검색해 보세요.</p>
          )}
        </div>
      )}
    </>
  );
}
