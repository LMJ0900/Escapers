import { createUserIdSetStore } from "@/mocks/state/createUserIdSetStore";

const store = createUserIdSetStore("msw-mock-theme-likes-v1");

/** 계정별로 좋아요한 테마 id 를 기억한다. */
export const themeLikeStore = {
  isLiked: store.has,
  setLiked: store.set,
};
