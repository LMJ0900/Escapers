import { load, type CheerioAPI } from "cheerio";
import type {
  CrawledBranch,
  CrawledTheme,
  CrawledThemesResult,
  CrawlerAdapter,
  CrawlerAdapterContext,
} from "./crawler.adapter";

/**
 * 제로월드 (zeroworldkorea.com). PHP 서버 렌더링이라 Cheerio로 충분하다.
 * robots.txt: 전체 허용.
 *
 * "제로월드"(s_subj=A)와 "제로월드 다이브"(s_subj=B)는 같은 사이트 · 같은 회사라 한 브랜드로 묶는다.
 * 다이브 지점은 지점명에 "다이브"가 남아 구분된다.
 *
 * 수집 경로
 * 1. `home.php?go=rev.make&s_subj={A|B}`  지점 번호(zizum_num) · 지점명
 * 2. `home.php?go=location`               지점 주소 · 전화
 * 3. POST `rev.make.sel.php` act=theme_list    지점별 테마 번호 목록
 * 4. POST `rev.make.sel.php` act=theme_select  테마 상세 (장르 · 시간 · 인원 · 난이도 · 설명 · 포스터 · 인원별 가격)
 *
 * 테마 목록/상세는 별도 페이지 없이 예약 화면이 POST 로 받는 HTML 조각에만 있다.
 * 조회 전용 요청만 보내고, 예약 생성(rev.make 제출)은 보내지 않는다.
 * 테마 번호(theme_num)는 지점과 무관한 전역 ID라 그대로 externalId 로 쓴다.
 */
export class ZeroWorldAdapter implements CrawlerAdapter {
  readonly key = "zeroworld";
  readonly engine = "CHEERIO" as const;
  readonly defaults = {
    brandName: "제로월드",
    baseUrl: "https://zeroworldkorea.com",
  };

  async fetchThemes({
    baseUrl,
    fetcher,
  }: CrawlerAdapterContext): Promise<CrawledThemesResult> {
    const pageUrl = (query: string) =>
      `${baseUrl}/layout/res/home.php?${query}`;
    const selUrl = `${baseUrl}/core/res/rev.make.sel.php`;
    const revDays = todayInSeoul();

    const spots: Spot[] = [];
    for (const subject of SUBJECTS) {
      const page = load(
        await fetcher.getHtml(pageUrl(`go=rev.make&s_subj=${subject}`))
      );
      spots.push(...parseSpots(page, subject));
    }

    const locations = parseLocations(
      load(await fetcher.getHtml(pageUrl("go=location")))
    );
    const branches = spots.map(({ zizumNum, siteName }): CrawledBranch => ({
      externalId: zizumNum,
      name: branchName(siteName),
      // 오시는 길에 없는 지점이면 빈 값으로 두어 검증에서 걸러지게 한다
      address: locations.get(siteName)?.address ?? "",
      phone: locations.get(siteName)?.phone,
    }));

    const themes: CrawledTheme[] = [];
    for (const { zizumNum, subject } of spots) {
      const referer = pageUrl(
        `go=rev.make&s_subj=${subject}&zizum_num=${zizumNum}`
      );
      const list = load(
        await fetcher.postForm(
          selUrl,
          {
            act: "theme_list",
            zizum_num: zizumNum,
            rev_days: revDays,
            theme_num: "",
            s_subj: subject,
          },
          { referer }
        )
      );

      for (const themeNum of parseThemeNums(list)) {
        const detail = await fetcher.postForm(
          selUrl,
          {
            act: "theme_select",
            theme_num: themeNum,
            rev_days: revDays,
            theme_time_num: "",
          },
          { referer }
        );
        themes.push({
          externalId: themeNum,
          branchExternalId: zizumNum,
          ...parseThemeDetail(detail, baseUrl),
          detailUrl: pageUrl(
            `go=rev.make&s_subj=${subject}&zizum_num=${zizumNum}&theme_num=${themeNum}`
          ),
        });
      }
    }
    return { branches, themes };
  }
}

/** A: 제로월드, B: 제로월드 다이브 */
const SUBJECTS = ["A", "B"] as const;
type Subject = (typeof SUBJECTS)[number];

interface Spot {
  zizumNum: string;
  /** 사이트 표기 그대로 (예: "제로월드 - 김포본점"). 오시는 길과 매칭할 때 쓴다 */
  siteName: string;
  subject: Subject;
}

/** "제로월드 - 김포본점" → "김포본점", "제로월드 다이브 건대점" → "다이브 건대점" */
function branchName(siteName: string): string {
  return siteName.replace(/^제로월드\s*-?\s*/, "").trim() || siteName;
}

/** 예약 화면 상단의 지점 버튼 (`a.rese-spot__btn`) */
function parseSpots($: CheerioAPI, subject: Subject): Spot[] {
  const result: Spot[] = [];
  $("a.rese-spot__btn").each((_, el) => {
    const link = $(el);
    const zizumNum = /zizum_num=(\d+)/.exec(link.attr("href") ?? "")?.[1];
    // 첫 줄이 지점명, <span> 은 "경기 김포시" 같은 지역 표기
    const text = link.find(".rese-spot__text").clone();
    text.find("span").remove();
    const siteName = text.text().trim();
    if (zizumNum && siteName) result.push({ zizumNum, siteName, subject });
  });
  return result;
}

/** 오시는 길: 지점명 → 주소 · 전화 */
function parseLocations(
  $: CheerioAPI
): Map<string, { address: string; phone?: string }> {
  const result = new Map<string, { address: string; phone?: string }>();
  $(".tab-item_1").each((_, el) => {
    const item = $(el);
    const name = item.find(".map__title").first().text().trim();
    const address = item
      .find(".map__text")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const phone =
      item.find('a[href^="tel:"]').first().text().trim() || undefined;
    if (name && address) result.set(name, { address, phone });
  });
  return result;
}

/** `javascript:fun_theme_select('14','0')` → "14" */
function parseThemeNums($: CheerioAPI): string[] {
  const nums = new Set<string>();
  $("a.choice-themes__item").each((_, el) => {
    const match = /fun_theme_select\('(\d+)'/.exec($(el).attr("href") ?? "");
    if (match) nums.add(match[1]);
  });
  return [...nums];
}

type ThemeDetail = Omit<
  CrawledTheme,
  "externalId" | "branchExternalId" | "detailUrl"
>;

/**
 * theme_select 응답은 `{테마정보 HTML}{@}{인원 select HTML}` 두 조각이다.
 * 가격은 인원 select 옵션("2명 ( 54,000원 )")에만 있다.
 */
function parseThemeDetail(response: string, baseUrl: string): ThemeDetail {
  const [infoHtml, personHtml = ""] = response.split("{@}");
  const $ = load(infoHtml);

  const poster = $(".themes-info__poster");
  const imagePath = /url\(['"]?([^'")]+)['"]?\)/.exec(
    poster.attr("style") ?? ""
  )?.[1];
  const badge = (kind: string) =>
    $(`.themes-info__badge.${kind}`).first().text().trim() || undefined;

  const descriptionHtml = $(".themes-info__scroll .themes-info__text").html();
  const description = descriptionHtml
    ? load(descriptionHtml.replace(/<br\s*\/?>/gi, "\n"))
        .text()
        .replace(/\n{3,}/g, "\n\n")
        .trim() || undefined
    : undefined;

  const $person = load(personHtml);
  const priceRaw = $person("option")
    .map((_, el) => {
      const match = /(\d+)\s*명\s*\(\s*([\d,]+)\s*원/.exec($person(el).text());
      return match ? `${match[1]}인 ${match[2].replace(/,/g, "")}원` : null;
    })
    .get()
    .join(" / ");

  return {
    name: $(".themes-info__name").first().text().trim(),
    genreRaw:
      poster.find(".themes-info__poster-badge").text().trim() || undefined,
    playTimeRaw: badge("playtime"),
    playersRaw: badge("person"),
    // "2.5/5"
    difficultyRaw:
      $(".themes-info__level .themes-info__text").last().text().trim() ||
      undefined,
    description,
    imageUrl: imagePath ? new URL(imagePath, baseUrl).href : undefined,
    priceRaw: priceRaw || undefined,
  };
}

/** 예약 화면이 보내는 rev_days 형식 (YYYY-MM-DD, 한국 시간) */
function todayInSeoul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
