import type { UserRole } from "@/api/domain/user/getMe/response/getMeRes";

export interface MockAccount {
  id: string;
  email: string;
  password: string;
  nickname: string;
  role: UserRole;
}

const STORAGE_KEY = "msw-mock-accounts-v1";

const SEED_ACCOUNT: MockAccount = {
  id: "mock-user-1",
  email: "mock@test.com",
  password: "test1234!",
  nickname: "테스트유저",
  role: "MEMBER",
};

function loadAccounts(): Map<string, MockAccount> {
  if (typeof localStorage === "undefined") return new Map();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Map(JSON.parse(raw)) : new Map();
  } catch {
    return new Map();
  }
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...accounts]));
}

function seed(): void {
  accounts = new Map([[SEED_ACCOUNT.email, SEED_ACCOUNT]]);
  persist();
}

let accounts = loadAccounts();
if (accounts.size === 0) seed();

export const accountStore = {
  findByEmail: (email: string): MockAccount | undefined => accounts.get(email),

  existsByNickname: (nickname: string): boolean =>
    [...accounts.values()].some((account) => account.nickname === nickname),

  add: (account: MockAccount): void => {
    accounts.set(account.email, account);
    persist();
  },

  /** 개발 중 목 계정 목록을 시드 상태로 되돌린다. devtools 콘솔에서 `resetMockAccounts()` 로 호출 가능. */
  reset: seed,
};

if (typeof window !== "undefined") {
  Object.assign(window, { resetMockAccounts: accountStore.reset });
}
