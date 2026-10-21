"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiLoader,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import { toast } from "react-toastify";

import type { ThemeBranchInfo } from "@/api/domain/theme/Theme.type";
import { KAKAO_MAP_APP_KEY } from "@/constant/environment";
import { bindClassNames } from "@/util/BindClassName";

import { loadKakaoMaps, type KakaoMap } from "./kakaoSdk";
import styles from "./LocationMap.module.css";

const cx = bindClassNames(styles);

const DEFAULT_MAP_LEVEL = 3;
const COPIED_LABEL_MS = 2000;

type MapStatus = "loading" | "ready" | "error";

type LocationMapProps = {
  branch: ThemeBranchInfo;
};

/** 카카오맵 길찾기/보기 링크. 좌표가 있으면 마커 위치로, 없으면 주소 검색으로 연다. */
function buildKakaoMapUrl(branch: ThemeBranchInfo): string | null {
  if (branch.latitude !== null && branch.longitude !== null) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(branch.name)},${branch.latitude},${branch.longitude}`;
  }
  if (branch.address) {
    return `https://map.kakao.com/link/search/${encodeURIComponent(branch.address)}`;
  }
  return null;
}

/**
 * 지점 위치: 카카오맵 + 주소 정보. 지도는 외부 SDK 라 불러오는 중/실패 상태가 있고,
 * 실패하거나 좌표·키가 없어도 주소와 외부 링크는 그대로 남는다.
 */
export default function LocationMap({ branch }: LocationMapProps) {
  const { latitude, longitude } = branch;
  const canRenderMap =
    latitude !== null && longitude !== null && KAKAO_MAP_APP_KEY !== "";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<MapStatus>(
    canRenderMap ? "loading" : "error"
  );
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!canRenderMap || !container || latitude === null || longitude === null)
      return;

    let cancelled = false;
    let overlay: { setMap(map: null): void } | null = null;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled) return;

        const position = new kakao.maps.LatLng(latitude, longitude);
        const map = new kakao.maps.Map(container, {
          center: position,
          level: DEFAULT_MAP_LEVEL,
          // 페이지 스크롤이 지도 확대/축소에 먹히지 않도록 휠 줌은 끈다.
          scrollwheel: false,
        });

        const content = document.createElement("div");
        content.className = styles.overlay;
        const label = document.createElement("span");
        label.className = styles.overlayLabel;
        label.textContent = branch.name;
        const pin = document.createElement("span");
        pin.className = styles.overlayPin;
        content.append(label, pin);

        const customOverlay = new kakao.maps.CustomOverlay({
          position,
          content,
          xAnchor: 0.5,
          yAnchor: 1,
        });
        customOverlay.setMap(map);

        mapRef.current = map;
        overlay = customOverlay;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      overlay?.setMap(null);
      mapRef.current = null;
      container.replaceChildren();
    };
  }, [canRenderMap, latitude, longitude, branch.name, attempt]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null)
        window.clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const handleRetry = () => {
    setStatus("loading");
    setAttempt((prev) => prev + 1);
  };

  const handleZoom = (delta: number) => {
    const map = mapRef.current;
    if (map) map.setLevel(map.getLevel() + delta, { animate: true });
  };

  const handleCopyAddress = async () => {
    if (!branch.address) return;

    try {
      await navigator.clipboard.writeText(branch.address);
    } catch {
      toast.error("주소를 복사하지 못했어요. 직접 선택해 복사해주세요.");
      return;
    }

    toast.success("주소가 복사됐어요.");
    setCopied(true);
    if (copiedTimerRef.current !== null)
      window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPIED_LABEL_MS
    );
  };

  const kakaoMapUrl = buildKakaoMapUrl(branch);
  const infoRows = [
    { label: "주소", value: branch.address },
    { label: "가는 길", value: branch.transit },
    { label: "연락처", value: branch.phone },
    { label: "영업시간", value: branch.openingHours },
  ].filter(
    (row): row is { label: string; value: string } => row.value !== null
  );

  return (
    <section id="location" className={cx("root")}>
      <h2 className={cx("title")}>위치</h2>

      <div className={cx("mapBox")}>
        {/* SDK 가 이 컨테이너 안에 지도를 그린다. 상태 화면은 그 위에 겹쳐 보여준다. */}
        <div ref={containerRef} className={cx("mapCanvas")} />

        {status === "ready" && (
          <div className={cx("zoom")}>
            <button
              type="button"
              className={cx("zoomButton")}
              aria-label="지도 확대"
              onClick={() => handleZoom(-1)}
            >
              <FiPlus aria-hidden />
            </button>
            <button
              type="button"
              className={cx("zoomButton")}
              aria-label="지도 축소"
              onClick={() => handleZoom(1)}
            >
              <FiMinus aria-hidden />
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className={cx("state")} role="status">
            <FiLoader className={cx("spinner")} aria-hidden />
            <span>지도를 불러오는 중</span>
          </div>
        )}

        {status === "error" && (
          <div className={cx("state", "stateError")}>
            <FiAlertCircle className={cx("errorIcon")} aria-hidden />
            <span>
              {latitude === null || longitude === null
                ? "지점 위치 정보가 아직 없어요"
                : "지도를 불러오지 못했어요"}
            </span>
            <div className={cx("stateActions")}>
              {canRenderMap && (
                <button
                  type="button"
                  className={cx("button")}
                  onClick={handleRetry}
                >
                  다시 시도
                </button>
              )}
              {kakaoMapUrl && (
                <a
                  href={kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx("button")}
                >
                  카카오맵에서 보기
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={cx("infoRow")}>
        <dl className={cx("info")}>
          {infoRows.map((row) => (
            <div key={row.label} className={cx("infoItem")}>
              <dt className={cx("infoLabel")}>{row.label}</dt>
              <dd className={cx("infoValue")}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className={cx("actions")}>
          {branch.address && (
            <button
              type="button"
              className={cx("button")}
              onClick={handleCopyAddress}
            >
              {copied ? <FiCheck aria-hidden /> : <FiCopy aria-hidden />}
              {copied ? "복사됨" : "주소 복사"}
            </button>
          )}
          {kakaoMapUrl && (
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cx("button")}
            >
              <FiExternalLink aria-hidden />
              카카오맵에서 보기
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
