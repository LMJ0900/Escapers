import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./LikeButton.module.css";

const cx = bindClassNames(styles);

type LikeButtonProps = {
  liked: boolean;
  /** 스크린리더용 라벨에 쓰는 테마 이름 */
  themeName: string;
  pending: boolean;
  onToggle: () => void;
};

export default function LikeButton({
  liked,
  themeName,
  pending,
  onToggle,
}: LikeButtonProps) {
  return (
    <button
      type="button"
      className={cx("heart", { heartLiked: liked })}
      aria-pressed={liked}
      aria-label={liked ? `${themeName} 좋아요 취소` : `${themeName} 좋아요`}
      disabled={pending}
      onClick={onToggle}
    >
      {liked ? <FaHeart aria-hidden /> : <FiHeart aria-hidden />}
    </button>
  );
}
