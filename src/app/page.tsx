import { ThemeQuery } from "@/api/domain/theme/Theme.query";

import HotThemes from "./_component/HotThemes/HotThemes";

export default async function Home() {
  const hotThemes = await ThemeQuery.getHotThemes();

  return (
    <main>
      <HotThemes initialHotThemes={hotThemes} />
    </main>
  );
}
