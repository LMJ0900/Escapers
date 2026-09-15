import LogoutHandler from "./_component/LogoutHandler/LogoutHandler";

/**
 * (guest) 그룹 밖에 있는 라우트다 — (guest)/layout.tsx의 쿠키 존재 체크에 걸리지 않아야
 * 세션이 아직 안 지워진 상태로도 이 페이지에 안전하게 도달할 수 있다.
 * 실제 쿠키 삭제는 클라이언트에서 호출하는 Server Action(clearAuthToken)이 담당한다.
 */
export default async function LogoutPage({
  searchParams,
}: PageProps<"/auth/logout">) {
  const { reason } = await searchParams;

  return <LogoutHandler reason={typeof reason === "string" ? reason : undefined} />;
}
