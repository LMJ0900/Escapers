import { spawn } from "node:child_process";

// NEXT_PUBLIC_API_MOCKING 을 켠 채로 next dev 를 띄운다.
// 이미 설정된 process.env 는 .env* 파일이 덮어쓰지 않으므로 항상 목킹으로 뜬다.
// Windows 에서 node_modules/.bin 의 next.cmd 를 찾으려면 shell 이 필요하다.
const command = ["next", "dev", ...process.argv.slice(2)].join(" ");

const child = spawn(command, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_API_MOCKING: "enabled" },
});

child.on("exit", (code) => process.exit(code ?? 0));
