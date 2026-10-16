#!/usr/bin/env node
// @ts-check
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { parseArgs } from "node:util";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ROOT = resolve(import.meta.dirname, "..");

const HELP = `
Usage: node scripts/createComponent.mjs <Name> [<Name> ...] [options]

Options:
  --app <route>   src/app/<route>/_component/ 아래에 생성
  --common        src/components/ 아래에 생성 (기본값)
  --client        컴포넌트에 "use client" 지시어 추가
  --force         디렉터리가 이미 있어도 덮어쓰기
  -h, --help      도움말

Examples:
  node scripts/createComponent.mjs Button
  node scripts/createComponent.mjs Header Footer
  node scripts/createComponent.mjs LoginForm --app login --client
`;

/** 파일명 토큰 → 실제 컴포넌트명 치환 */
const templates = {
  "__NAME__.tsx": (name, client) =>
    `${client ? '"use client";\n\n' : ""}import { bindClassNames } from "@/util/BindClassName";

import styles from "./${name}.module.css";

const cx = bindClassNames(styles);

export default function ${name}() {
  return <div className={cx("root")}>${name}</div>;
}
`,
  "__NAME__.module.css": () => `.root {
}
`,
  "index.tsx": (name) => `export { default } from "./${name}";
`,
};

const isPascalCase = (s) => /^[A-Z][A-Za-z0-9]*$/.test(s);

async function promptForNames() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question("Component name(s) (space-separated): ");
    return answer.trim().split(/\s+/).filter(Boolean);
  } finally {
    rl.close();
  }
}

async function generateOne(baseDir, name, { client, force }) {
  const dir = join(baseDir, name);
  if (existsSync(dir) && !force) {
    console.error(
      `  skip   ${relative(ROOT, dir)} (이미 존재, --force 로 덮어쓰기)`
    );
    return false;
  }
  await mkdir(dir, { recursive: true });
  for (const [token, render] of Object.entries(templates)) {
    const filePath = join(dir, token.replace("__NAME__", name));
    await writeFile(filePath, render(name, client), "utf8");
    console.log(`  create ${relative(ROOT, filePath)}`);
  }
  return true;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      app: { type: "string" },
      common: { type: "boolean", default: false },
      client: { type: "boolean", default: false },
      force: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) return void console.log(HELP);

  if (values.app && values.common) {
    console.error("Error: --app 과 --common 은 함께 쓸 수 없다.");
    process.exitCode = 1;
    return;
  }

  let names = positionals;
  if (names.length === 0) names = await promptForNames();
  if (names.length === 0) {
    console.error("Error: 컴포넌트 이름이 없다.");
    process.exitCode = 1;
    return;
  }

  const invalid = names.filter((n) => !isPascalCase(n));
  if (invalid.length) {
    console.error(
      `Error: 컴포넌트 이름은 PascalCase 여야 한다 → ${invalid.join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const baseDir = values.app
    ? resolve(ROOT, "src/app", values.app, "_component")
    : resolve(ROOT, "src/components");

  console.log(`\nTarget: ${relative(ROOT, baseDir)}/\n`);

  let created = 0;
  for (const name of names) {
    if (await generateOne(baseDir, name, values)) created += 1;
  }
  console.log(`\nDone. ${created}/${names.length} generated.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
