import Image from "next/image";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThemePhoto.module.css";

const cx = bindClassNames(styles);

type ThemePhotoProps = {
  name: string;
  /** 크롤링 소스에 이미지가 없으면 null — 빈 배경만 보여준다. */
  imageUrl: string | null;
};

/** 테마 대표 사진 한 장. */
export default function ThemePhoto({ name, imageUrl }: ThemePhotoProps) {
  return (
    <div className={cx("root")}>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`${name} 대표 사진`}
          fill
          priority
          sizes="(max-width: 1008px) 100vw, 880px"
          className={cx("poster")}
        />
      )}
    </div>
  );
}
