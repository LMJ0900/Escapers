import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../../config/env";
import { CrawlBlockedError, CrawlDisallowedError } from "../crawler.error";

const REQUEST_TIMEOUT_MS = 30_000;

interface RobotsRules {
  allow: string[];
  disallow: string[];
}

/**
 * 크롤링 정책(백엔드 명세서 §6.3)을 강제하는 HTTP 클라이언트.
 * - 오리진별 동시 1요청 · 최소 간격(CRAWLER_MIN_INTERVAL_MS)
 * - robots.txt 의 `User-agent: *` 규칙 준수
 * - 식별 가능한 User-Agent
 * - 403/429 는 CrawlBlockedError 로 던져 우회하지 않는다
 */
@Injectable()
export class PoliteFetcher {
  private readonly logger = new Logger(PoliteFetcher.name);
  private readonly userAgent: string;
  private readonly minIntervalMs: number;
  /** 오리진별 마지막 요청 체인. 직렬화와 간격 유지를 함께 처리한다 */
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly robots = new Map<string, Promise<RobotsRules>>();

  constructor(config: ConfigService<Env, true>) {
    this.userAgent = config.get("CRAWLER_USER_AGENT");
    this.minIntervalMs = config.get("CRAWLER_MIN_INTERVAL_MS");
  }

  getHtml(url: string): Promise<string> {
    return this.fetchText(url);
  }

  /**
   * 폼 POST. 화면 조각을 POST 로만 내려주는 사이트(예: 예약 화면 AJAX)용.
   * 조회 요청에만 쓰고, 예약 생성처럼 상태를 바꾸는 요청에는 쓰지 않는다.
   */
  postForm(
    url: string,
    form: Record<string, string>,
    { referer }: { referer?: string } = {}
  ): Promise<string> {
    return this.fetchText(url, {
      method: "POST",
      body: new URLSearchParams(form),
      headers: referer ? { Referer: referer } : undefined,
    });
  }

  private async fetchText(url: string, init?: RequestInit): Promise<string> {
    const target = new URL(url);
    const rules = await this.getRobots(target.origin);
    if (!isAllowed(rules, target.pathname)) {
      throw new CrawlDisallowedError(url);
    }
    return this.schedule(target.origin, () => this.request(url, init));
  }

  private getRobots(origin: string): Promise<RobotsRules> {
    let rules = this.robots.get(origin);
    if (!rules) {
      rules = this.schedule(origin, async () => {
        const res = await this.rawFetch(`${origin}/robots.txt`);
        // robots.txt 가 없으면(4xx) 제한 없음으로 본다
        if (!res.ok) return { allow: [], disallow: [] };
        return parseRobots(await res.text());
      });
      this.robots.set(origin, rules);
    }
    return rules;
  }

  private async request(url: string, init?: RequestInit): Promise<string> {
    const res = await this.rawFetch(url, init);
    if (res.status === 403 || res.status === 429) {
      throw new CrawlBlockedError(url, res.status);
    }
    if (!res.ok) {
      throw new Error(`요청 실패 (${res.status}): ${url}`);
    }
    return res.text();
  }

  private rawFetch(url: string, init: RequestInit = {}): Promise<Response> {
    this.logger.debug(`${init.method ?? "GET"} ${url}`);
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        "User-Agent": this.userAgent,
        Accept: "text/html,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  /** 같은 오리진의 작업을 순서대로, 최소 간격을 두고 실행한다 */
  private schedule<T>(origin: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(origin) ?? Promise.resolve();
    const run = previous
      .catch(() => undefined)
      .then(async () => {
        try {
          return await task();
        } finally {
          await sleep(this.minIntervalMs);
        }
      });
    this.queues.set(origin, run);
    return run;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `User-agent: *` 그룹의 Allow/Disallow 만 읽는 최소 파서 */
export function parseRobots(text: string): RobotsRules {
  const rules: RobotsRules = { allow: [], disallow: [] };
  let inWildcardGroup = false;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === "user-agent") {
      // 연속된 User-agent 줄은 같은 그룹이다
      inWildcardGroup = (lastWasAgent && inWildcardGroup) || value === "*";
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!inWildcardGroup || !value) continue;
    if (field === "allow") rules.allow.push(value);
    if (field === "disallow") rules.disallow.push(value);
  }
  return rules;
}

/** 가장 긴 접두사 규칙이 이긴다 (Google 방식). 와일드카드는 지원하지 않는다 */
export function isAllowed(rules: RobotsRules, path: string): boolean {
  const longest = (prefixes: string[]) =>
    Math.max(
      -1,
      ...prefixes.filter((p) => path.startsWith(p)).map((p) => p.length)
    );
  return longest(rules.allow) >= longest(rules.disallow);
}
