"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchContextValue = {
  /** 검색창이 펼쳐져 있는지 */
  isOpen: boolean;
  /** 입력창에 들어 있는 값 그대로(공백 포함) */
  query: string;
  /** 공백을 뺀 검색어가 있어 본문이 검색 결과로 바뀌어야 하는지 */
  isSearching: boolean;
  setQuery: (query: string) => void;
  open: () => void;
  /** 검색어를 모두 지우고 검색창을 접는다. 보던 화면은 그대로 되살아난다. */
  close: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const value = useContext(SearchContext);
  if (!value) {
    throw new Error("useSearch 는 SearchProvider 안에서만 쓸 수 있어요.");
  }
  return value;
}

/** 헤더의 검색창과 본문의 검색 결과 화면이 함께 보는 검색 상태. */
export default function SearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setQuery("");
    setIsOpen(false);
  }, []);

  // 다른 페이지로 이동하면(테마 카드·메뉴 클릭, 뒤로 가기 등) 검색 화면을 걷어낸다.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    close();
  }

  const value = useMemo(
    () => ({
      isOpen,
      query,
      isSearching: query.trim() !== "",
      setQuery,
      open,
      close,
    }),
    [isOpen, query, open, close]
  );

  return <SearchContext value={value}>{children}</SearchContext>;
}
