import { Injectable } from "@nestjs/common";
import type { CrawlerAdapter } from "./crawler.adapter";
import { NextEditionAdapter } from "./nextedition.adapter";

// 새 브랜드 어댑터는 여기에 추가한다. key 는 Source.adapterKey 와 같아야 한다.
const ADAPTERS: CrawlerAdapter[] = [new NextEditionAdapter()];

@Injectable()
export class AdapterRegistry {
  private readonly adapters = new Map(ADAPTERS.map((a) => [a.key, a]));

  get(key: string): CrawlerAdapter {
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new Error(
        `알 수 없는 어댑터입니다: ${key} (사용 가능: ${this.keys().join(", ")})`
      );
    }
    return adapter;
  }

  keys(): string[] {
    return [...this.adapters.keys()];
  }
}
