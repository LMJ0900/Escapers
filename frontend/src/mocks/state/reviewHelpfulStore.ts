import { createUserIdSetStore } from "@/mocks/state/createUserIdSetStore";

const store = createUserIdSetStore("msw-mock-review-helpful-v1");

/** 계정별로 "도움이 돼요"를 누른 후기 id 를 기억한다. */
export const reviewHelpfulStore = {
  isHelped: store.has,
  setHelped: store.set,
};
