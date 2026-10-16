import { load, type CheerioAPI } from "cheerio";
import type {
  CrawledBranch,
  CrawledTheme,
  CrawledThemesResult,
  CrawlerAdapter,
  CrawlerAdapterContext,
} from "./crawler.adapter";

/**
 * 지구별방탈출 (지구별방탈출.com). 서버 렌더링된 정적 HTML이라 Cheerio로 충분하다.
 * robots.txt: 전체 허용.
 *
 * 수집 경로
 * 1. `/theme`             지점 목록(select) · 전체 테마 (장르 · 인원 · 시간 · 난이도 · 설명 · 포스터)
 * 2. `/map?branch={id}`   지점 주소 · 전화
 *
 * 모든 테마의 예약 링크(`/reservation?branch=4&theme=22`)에 숫자 ID가 있어 그대로 externalId 로 쓴다.
 * 가격은 사이트에 텍스트로 없어서 비워 둔다. "공포" 단계는 담을 필드가 없어 버린다.
 */
export class JigubyeolAdapter implements CrawlerAdapter {
  readonly key = "jigubyeol";
  readonly engine = "CHEERIO" as const;
  readonly defaults = {
    brandName: "지구별방탈출",
    baseUrl: "https://xn--2e0b040a4xj.com",
  };

  async fetchThemes({
    baseUrl,
    fetcher,
  }: CrawlerAdapterContext): Promise<CrawledThemesResult> {
    const archive = load(await fetcher.getHtml(`${baseUrl}/theme`));

    const branches: CrawledBranch[] = [];
    for (const { id, name } of parseBranchOptions(archive)) {
      const page = load(await fetcher.getHtml(`${baseUrl}/map?branch=${id}`));
      branches.push({ externalId: id, name, ...parseBranchInfo(page) });
    }

    return { branches, themes: parseThemes(archive, baseUrl) };
  }
}

/** 지점 선택 select. 값이 빈 "전체" 옵션은 뺀다 */
function parseBranchOptions($: CheerioAPI): { id: string; name: string }[] {
  return $('select[name="branch"] option')
    .map((_, el) => ({
      id: $(el).attr("value")?.trim() ?? "",
      name: $(el).text().trim(),
    }))
    .get()
    .filter((option) => option.id && option.name);
}

function parseBranchInfo($: CheerioAPI): { address: string; phone?: string } {
  const row = (label: string) =>
    $(".main-info tr")
      .filter((_, tr) => $(tr).find("th").text().trim() === label)
      .find("td")
      .first();
  return {
    address: row("주소").text().replace(/\s+/g, " ").trim(),
    phone: row("고객센터").text().trim() || undefined,
  };
}

function parseThemes($: CheerioAPI, baseUrl: string): CrawledTheme[] {
  return $("section.theme-item")
    .map((_, el): CrawledTheme => {
      const item = $(el);
      const facts = new Map<string, string>();
      item.find(".eveThemeInfo table tr").each((_, tr) => {
        facts.set(
          $(tr).find("th").text().trim(),
          $(tr).find("td").text().trim()
        );
      });
      const fact = (label: string) => facts.get(label) || undefined;

      // 예약 링크의 branch · theme 파라미터. 없으면 빈 값으로 두어 검증에서 걸러지게 한다
      const reservation = new URL(
        item.find(".theme-item-btn a").attr("href") ?? "/reservation",
        baseUrl
      );
      reservation.hash = "";

      return {
        externalId: reservation.searchParams.get("theme") ?? "",
        branchExternalId: reservation.searchParams.get("branch") ?? "",
        name: item.find(".eveThemeInfo h2 .ff-bhs").first().text().trim(),
        genreRaw: fact("장르"),
        playersRaw: fact("인원"),
        playTimeRaw: fact("시간"),
        difficultyRaw: fact("난이도"),
        description:
          item.find(".eveThemeInfo > p").first().text().trim() || undefined,
        imageUrl: item.find(".eveThemeThumb img").attr("src"),
        detailUrl: reservation.href,
      };
    })
    .get();
}
