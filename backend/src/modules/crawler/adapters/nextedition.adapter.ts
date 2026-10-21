import { load, type CheerioAPI } from "cheerio";
import type {
  CrawledBranch,
  CrawledTheme,
  CrawledThemesResult,
  CrawlerAdapter,
  CrawlerAdapterContext,
} from "./crawler.adapter";

/**
 * 넥스트에디션 (nextedition.co.kr). 서버 렌더링된 정적 HTML이라 Cheerio로 충분하다.
 * robots.txt: `/api/` 만 금지 → HTML 페이지만 읽는다.
 *
 * 수집 경로
 * 1. `/`                  지점 slug 목록, 추천 테마의 숫자 ID
 * 2. `/branches/{slug}/`  지점 주소 · 좌표(JSON-LD) · 전화, 테마 숫자 ID (최대 5개만 노출)
 * 3. `/themes/`           전체 테마 상세 (장르 · 인원 · 난이도 · 시간 · 포스터 · 설명)
 *
 * 숫자 테마 ID는 일부 테마에만 HTML에 노출되고 나머지는 금지 경로(`/api/`)로만 받을 수 있다.
 * 그래서 externalId 는 항상 `{지점 slug}:{테마명}` 으로 만들고, 숫자 ID는 알 때만 예약 링크에 쓴다.
 * (ID 노출 여부가 바뀌어도 externalId 가 흔들리지 않게 하기 위함)
 *
 * 빈자리 수집(fetchSlots)은 구현하지 않는다. 예약 화면이 시간을 금지 경로(`/api/booking/…`)로만 받아온다.
 */
export class NextEditionAdapter implements CrawlerAdapter {
  readonly key = "nextedition";
  readonly engine = "CHEERIO" as const;
  readonly defaults = {
    brandName: "넥스트에디션",
    baseUrl: "https://nextedition.co.kr",
  };

  async fetchThemes({
    baseUrl,
    fetcher,
  }: CrawlerAdapterContext): Promise<CrawledThemesResult> {
    const home = load(await fetcher.getHtml(`${baseUrl}/`));
    const themeIds = new Map<string, string>();
    collectThemeIds(home, themeIds);

    const branches: CrawledBranch[] = [];
    for (const slug of parseBranchSlugs(home)) {
      const page = load(await fetcher.getHtml(`${baseUrl}/branches/${slug}/`));
      branches.push(parseBranch(page, slug));
      collectThemeIds(page, themeIds);
    }
    const slugByBranchName = new Map(
      branches.map((b) => [b.name, b.externalId])
    );

    const archive = load(await fetcher.getHtml(`${baseUrl}/themes/`));
    const priceRaws = parseThemePrices(archive);
    const themes = parseThemeArchive(archive).map(
      ({ branchName, name, ...detail }): CrawledTheme => {
        // 지점 목록에 없는 지점명이면 빈 값으로 두어 검증에서 걸러지게 한다
        const slug = slugByBranchName.get(branchName) ?? "";
        const id = themeIds.get(themeKey(slug, name));
        return {
          externalId: themeKey(slug, name),
          branchExternalId: slug,
          name,
          ...detail,
          priceRaw: priceRaws.get(themeKey(branchName, name)),
          detailUrl: id
            ? `${baseUrl}/reservation/${slug}/?theme=${id}`
            : `${baseUrl}/reservation/${slug}/`,
        };
      }
    );
    return { branches, themes };
  }
}

type ArchiveTheme = Omit<
  CrawledTheme,
  "externalId" | "branchExternalId" | "detailUrl"
> & { branchName: string };

const themeKey = (slug: string, themeName: string) =>
  `${slug}:${themeName.trim()}`;

/** 예약 링크(`a[data-ga-theme]`)에서 (지점 slug, 테마명) → 숫자 ID 를 모은다 */
function collectThemeIds($: CheerioAPI, into: Map<string, string>) {
  $("a[data-ga-theme][data-ga-branch]").each((_, el) => {
    const link = $(el);
    const name = link.closest("li").find("h3").first().text();
    const slug = link.attr("data-ga-branch");
    const id = link.attr("data-ga-theme");
    if (name && slug && id) into.set(themeKey(slug, name), id);
  });
}

function parseBranchSlugs($: CheerioAPI): string[] {
  const slugs = new Set<string>();
  $('a[href^="/branches/"]').each((_, el) => {
    const match = /^\/branches\/([^/]+)\/$/.exec($(el).attr("href") ?? "");
    if (match) slugs.add(match[1]);
  });
  return [...slugs];
}

/** "정보 없음" 같은 값은 없는 것으로 본다 */
function cleanValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "정보 없음" ? trimmed : undefined;
}

function parseThemeArchive($: CheerioAPI): ArchiveTheme[] {
  const result: ArchiveTheme[] = [];

  $("li.theme-archive__item").each((_, item) => {
    const $item = $(item);
    const meta = $item.find(".theme-archive__meta");
    const branchName = meta.children("span").first().text().trim();
    const name = meta.find("h3").first().text().trim();

    const facts = new Map<string, string>();
    meta.find("dl.theme-archive__facts > div").each((_, row) => {
      facts.set($(row).find("dt").text().trim(), $(row).find("dd").text());
    });

    result.push({
      branchName,
      name,
      genreRaw: cleanValue(facts.get("장르")),
      difficultyRaw: cleanValue(facts.get("난이도")),
      playersRaw: cleanValue(facts.get("추천 인원")),
      playTimeRaw: cleanValue(facts.get("플레이 시간")),
      imageUrl: $item.find("img.theme-archive__poster-image").attr("src"),
      description: parseDescription(
        $item.find(".theme-detail__description p").last().text()
      ),
    });
  });
  return result;
}

/**
 * 가격은 HTML에 텍스트로 없고(지점별 가격표 이미지뿐) Next.js RSC 페이로드
 * (`self.__next_f.push([1, "..."])`)에만 테마별 `prices` 배열로 들어 있다.
 * 비공개 구조라 사이트 빌드가 바뀌면 깨질 수 있다 → 못 찾으면 가격만 비운다.
 */
function readFlightPayload($: CheerioAPI): string {
  let payload = "";
  $("script").each((_, el) => {
    const chunk = /^self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)$/.exec(
      $(el).text().trim()
    );
    if (chunk) payload += JSON.parse(chunk[1]) as string;
  });
  return payload;
}

/** (지점명, 테마명) → "2인 44000원 / 3인 66000원 …" (normalizePriceFrom 입력 형식) */
function parseThemePrices($: CheerioAPI): Map<string, string> {
  const payload = readFlightPayload($);
  const unescape = (s: string) => JSON.parse(`"${s}"`) as string;

  const storeNames = new Map<string, string>();
  for (const [, id, name] of payload.matchAll(
    /"id":"([^"]+)","macroId":"[^"]*","name":"((?:[^"\\]|\\.)*)"/g
  )) {
    storeNames.set(id, unescape(name));
  }

  const result = new Map<string, string>();
  for (const [, storeId, title, prices] of payload.matchAll(
    /"storeId":"([^"]+)","title":"((?:[^"\\]|\\.)*)"[\s\S]*?"prices":(\[[^\]]*\])/g
  )) {
    const branchName = storeNames.get(storeId);
    const priceRaw = (
      JSON.parse(prices) as { players: number; amount: number }[]
    )
      .map(({ players, amount }) => `${players}인 ${amount}원`)
      .join(" / ");
    if (branchName && priceRaw) {
      result.set(themeKey(branchName, unescape(title)), priceRaw);
    }
  }
  return result;
}

/** 설명 앞에 반복되는 "장르 - …" · "플레이 시간: …" 같은 머리글 줄을 떼어낸다 */
function parseDescription(text: string): string | undefined {
  const body = text
    .split("\n")
    .filter(
      (line) =>
        !/^(장르|추천\s*인원|난이도|플레이\s*시간)\s*[-:]/.test(line.trim())
    )
    .join("\n")
    .trim();
  return body || undefined;
}

interface JsonLdPlace {
  telephone?: string;
  address?: {
    addressRegion?: string;
    addressLocality?: string;
    streetAddress?: string;
  };
  geo?: { latitude?: number; longitude?: number };
}

function parseBranch($: CheerioAPI, slug: string): CrawledBranch {
  let place: JsonLdPlace = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text()) as JsonLdPlace & {
        "@type"?: string;
      };
      if (data["@type"] === "EntertainmentBusiness") place = data;
    } catch {
      // 다른 JSON-LD 블록은 무시한다
    }
  });

  const hero = $("header.branch-page__hero");
  const jsonLdAddress = [
    place.address?.addressRegion,
    place.address?.addressLocality,
    place.address?.streetAddress,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    externalId: slug,
    name: hero.find("h1").first().text().trim(),
    address: hero.find("address > span").first().text().trim() || jsonLdAddress,
    lat: place.geo?.latitude,
    lng: place.geo?.longitude,
    phone:
      hero.find('address a[href^="tel:"]').first().text().trim() ||
      place.telephone,
  };
}
