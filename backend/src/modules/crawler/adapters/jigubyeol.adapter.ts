import { load, type CheerioAPI } from "cheerio";
import type {
  CrawledBranch,
  CrawledSlot,
  CrawledSlotsResult,
  CrawledTheme,
  CrawledThemesResult,
  CrawlerAdapter,
  CrawlerAdapterContext,
  SlotTargetTheme,
} from "./crawler.adapter";

/**
 * 지구별방탈출 (지구별방탈출.com). 서버 렌더링된 정적 HTML이라 Cheerio로 충분하다.
 * robots.txt: 전체 허용.
 *
 * 수집 경로
 * 1. `/theme`             지점 목록(select) · 전체 테마 (장르 · 인원 · 시간 · 난이도 · 설명 · 포스터)
 * 2. `/map?branch={id}`   지점 주소 · 전화
 * 3. `/reservation?branch={id}&date={YYYY-MM-DD}`  지점 전체 테마의 예약 시간 (빈자리 수집)
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

  /** 지점 · 날짜마다 예약 화면을 한 번씩 읽는다. 한 화면에 지점의 모든 테마 시간이 있다 */
  async fetchSlots(
    { baseUrl, fetcher }: CrawlerAdapterContext,
    themes: SlotTargetTheme[],
    dates: string[]
  ): Promise<CrawledSlotsResult> {
    const themesByBranch = new Map<string, SlotTargetTheme[]>();
    for (const theme of themes) {
      const list = themesByBranch.get(theme.branchExternalId) ?? [];
      list.push(theme);
      themesByBranch.set(theme.branchExternalId, list);
    }

    const slots: CrawledSlot[] = [];
    for (const [branchId, branchThemes] of themesByBranch) {
      const idByName = new Map(branchThemes.map((t) => [t.name, t.externalId]));
      for (const date of dates) {
        const page = load(
          await fetcher.getHtml(
            `${baseUrl}/reservation?branch=${branchId}&date=${date}`
          )
        );
        slots.push(...parseReservationSlots(page, date, idByName));
      }
    }
    return { slots };
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

/**
 * 예약 화면의 테마 섹션(`section.res-item`)마다 시간 버튼이 있고 "예약가능" · "예약불가" 라벨로 구분한다.
 * 섹션에는 테마 ID가 없어(예약 가능한 버튼의 숨은 데이터에만 있다) `/theme` 와 같은 테마명으로 매칭한다.
 * 예약 기간 밖의 날짜를 요청하면 오늘 날짜 화면이 오므로, 날짜 입력값이 다르면 슬롯이 없는 것으로 본다.
 */
function parseReservationSlots(
  $: CheerioAPI,
  date: string,
  idByName: Map<string, string>
): CrawledSlot[] {
  if ($('form.search input[name="date"]').attr("value") !== date) return [];

  const slots: CrawledSlot[] = [];
  $("section.res-item").each((_, el) => {
    const section = $(el);
    const name = section.find("h2").first().text().trim();
    // 이름이 안 맞으면 숨은 데이터의 ID, 그것도 없으면 빈 값으로 두어 검증에서 걸러지게 한다
    const themeExternalId =
      idByName.get(name) ??
      hiddenThemeId(section.find(".eveHiddenData").first().text()) ??
      "";
    section.find(".res-times-btn button").each((_, button) => {
      slots.push({
        themeExternalId,
        date,
        time: $(button).find("span").first().text().trim(),
        available: $(button).find("label").text().trim() === "예약가능",
      });
    });
  });
  return slots;
}

/** `{"branch":4,"theme":24,"date":"2026-10-27","time":"09:50"}` → "24" */
function hiddenThemeId(json: string): string | undefined {
  try {
    const { theme } = JSON.parse(json) as { theme?: number };
    return theme === undefined ? undefined : String(theme);
  } catch {
    return undefined;
  }
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
