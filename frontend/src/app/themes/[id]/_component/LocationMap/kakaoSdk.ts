import { KAKAO_MAP_APP_KEY } from "@/constant/environment";

/** 카카오맵 JavaScript SDK 중에서 이 화면이 쓰는 부분만 옮겨 적은 타입. */
export interface KakaoLatLng {
  readonly __brand?: "KakaoLatLng";
}

export interface KakaoMap {
  getLevel(): number;
  setLevel(level: number, options?: { animate?: boolean }): void;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoNamespace {
  maps: {
    load(callback: () => void): void;
    LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
    Map: new (
      container: HTMLElement,
      options: { center: KakaoLatLng; level?: number; scrollwheel?: boolean }
    ) => KakaoMap;
    CustomOverlay: new (options: {
      position: KakaoLatLng;
      content: HTMLElement;
      xAnchor?: number;
      yAnchor?: number;
    }) => KakaoCustomOverlay;
  };
}

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

const SDK_LOAD_TIMEOUT_MS = 10_000;

let loadPromise: Promise<KakaoNamespace> | null = null;

/**
 * 카카오맵 SDK 를 한 번만 불러온다. 이미 불러왔으면 그대로 돌려주고, 실패하면 다음 호출에서
 * 다시 시도할 수 있게 캐시를 비운다. (autoload=false 라 `maps.load` 콜백까지 기다린다.)
 */
export function loadKakaoMaps(): Promise<KakaoNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 지도를 불러올 수 있어요."));
  }
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao);
  if (!KAKAO_MAP_APP_KEY) {
    return Promise.reject(new Error("카카오맵 앱 키가 설정되지 않았어요."));
  }

  loadPromise ??= new Promise<KakaoNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;
    script.async = true;

    const fail = (reason: string) => {
      window.clearTimeout(timeoutId);
      script.remove();
      loadPromise = null;
      reject(new Error(reason));
    };
    const timeoutId = window.setTimeout(
      () => fail("카카오맵 SDK 로드 시간이 초과됐어요."),
      SDK_LOAD_TIMEOUT_MS
    );

    script.onload = () => {
      if (!window.kakao?.maps) return fail("카카오맵 SDK 를 찾을 수 없어요.");
      window.kakao.maps.load(() => {
        window.clearTimeout(timeoutId);
        resolve(window.kakao as KakaoNamespace);
      });
    };
    script.onerror = () => fail("카카오맵 SDK 를 불러오지 못했어요.");

    document.head.append(script);
  });

  return loadPromise;
}
