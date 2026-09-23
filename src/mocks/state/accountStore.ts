import type { UserRole } from "@/api/domain/user/getMe/response/getMeRes";

/** User 에러명세서 §2.2 의 AUTH_ACCOUNT_SUSPENDED/WITHDRAWN 재현용 상태값. */
export type MockAccountStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";

export interface MockAccount {
  id: string;
  email: string;
  password: string;
  nickname: string;
  role: UserRole;
  marketingAgree: boolean;
  status: MockAccountStatus;
}

const STORAGE_KEY = "msw-mock-accounts-v1";

const SEED_ACCOUNT: MockAccount = {
  id: "mock-user-1",
  email: "mock@test.com",
  password: "test1234!",
  nickname: "테스트유저",
  role: "MEMBER",
  marketingAgree: true,
  status: "ACTIVE",
};

/**
 * AUTH_ACCOUNT_SUSPENDED/WITHDRAWN 테스트 전용 계정.
 * 로그인 자체는 통과하고(로그인 시점 정지/탈퇴 체크는 아직 "예정"),
 * 이후 /user/* 호출(authenticate)에서 403으로 막혀 verifySession이 강제 로그아웃한다.
 */
const SUSPENDED_TEST_ACCOUNT: MockAccount = {
  id: "mock-user-suspended",
  email: "suspended@test.com",
  password: "test1234!",
  nickname: "정지계정",
  role: "MEMBER",
  marketingAgree: false,
  status: "SUSPENDED",
};

const WITHDRAWN_TEST_ACCOUNT: MockAccount = {
  id: "mock-user-withdrawn",
  email: "withdrawn@test.com",
  password: "test1234!",
  nickname: "탈퇴계정",
  role: "MEMBER",
  marketingAgree: false,
  status: "WITHDRAWN",
};

/** v1 스토리지에는 없던 필드를 가진 옛 레코드를 안전한 기본값으로 채운다. */
function normalize(account: MockAccount): MockAccount {
  return {
    ...account,
    marketingAgree: account.marketingAgree ?? false,
    status: account.status ?? "ACTIVE",
  };
}

function loadAccounts(): Map<string, MockAccount> {
  if (typeof localStorage === "undefined") return new Map();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();

    const entries = JSON.parse(raw) as [string, MockAccount][];
    return new Map(
      entries.map(([email, account]) => [email, normalize(account)])
    );
  } catch {
    return new Map();
  }
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...accounts]));
}

function seed(): void {
  accounts = new Map(
    [SEED_ACCOUNT, SUSPENDED_TEST_ACCOUNT, WITHDRAWN_TEST_ACCOUNT].map(
      (account) => [account.email, account]
    )
  );
  persist();
}

let accounts = loadAccounts();
if (accounts.size === 0) {
  seed();
} else {
  // 기존 로컬스토리지에 남아있던 목 계정은 유지하되, 새로 추가된 테스트 계정이
  // 빠져있으면 채워 넣는다 — 이미 개발 중이던 브라우저에서도 바로 테스트 가능하도록.
  let hasNewTestAccount = false;
  for (const testAccount of [SUSPENDED_TEST_ACCOUNT, WITHDRAWN_TEST_ACCOUNT]) {
    if (!accounts.has(testAccount.email)) {
      accounts.set(testAccount.email, testAccount);
      hasNewTestAccount = true;
    }
  }
  if (hasNewTestAccount) persist();
}

export const accountStore = {
  findByEmail: (email: string): MockAccount | undefined => accounts.get(email),

  existsByNickname: (nickname: string): boolean =>
    [...accounts.values()].some((account) => account.nickname === nickname),

  /** 닉네임 중복 체크에서 본인 계정은 제외한다(그대로 저장해도 중복이 아니어야 함). */
  existsByNicknameExcept: (nickname: string, exceptEmail: string): boolean =>
    [...accounts.values()].some(
      (account) =>
        account.nickname === nickname && account.email !== exceptEmail
    ),

  add: (account: MockAccount): void => {
    accounts.set(account.email, account);
    persist();
  },

  updateNickname: (
    email: string,
    nickname: string
  ): MockAccount | undefined => {
    const account = accounts.get(email);
    if (!account) return undefined;

    const updated: MockAccount = { ...account, nickname };
    accounts.set(email, updated);
    persist();
    return updated;
  },

  /** 이메일이 토큰 subject라 맵의 키를 옮겨야 한다(email 자체가 계정 식별 키). */
  updateEmail: (
    oldEmail: string,
    newEmail: string
  ): MockAccount | undefined => {
    const account = accounts.get(oldEmail);
    if (!account) return undefined;

    const updated: MockAccount = { ...account, email: newEmail };
    accounts.delete(oldEmail);
    accounts.set(newEmail, updated);
    persist();
    return updated;
  },

  verifyPassword: (email: string, password: string): boolean =>
    accounts.get(email)?.password === password,

  updatePassword: (email: string, newPassword: string): void => {
    const account = accounts.get(email);
    if (!account) return;

    accounts.set(email, { ...account, password: newPassword });
    persist();
  },

  updateMarketingAgree: (
    email: string,
    marketingAgree: boolean
  ): MockAccount | undefined => {
    const account = accounts.get(email);
    if (!account) return undefined;

    const updated: MockAccount = { ...account, marketingAgree };
    accounts.set(email, updated);
    persist();
    return updated;
  },

  /** 회원 탈퇴(FR-AUTH-09): 목에서는 개인정보를 그대로 하드 삭제한다. */
  remove: (email: string): void => {
    accounts.delete(email);
    persist();
  },

  /** 개발 중 목 계정 목록을 시드 상태로 되돌린다. devtools 콘솔에서 `resetMockAccounts()` 로 호출 가능. */
  reset: seed,
};

if (typeof window !== "undefined") {
  Object.assign(window, { resetMockAccounts: accountStore.reset });
}
