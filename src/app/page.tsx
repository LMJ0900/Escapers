import { ThemeQuery } from "@/api/domain/theme/Theme.query";

import ThemeCarousel from "./_component/ThemeCarousel/ThemeCarousel";

export default async function Home() {
  const [hotThemes, horrorThemes] = await Promise.all([
    ThemeQuery.getHotThemes(),
    ThemeQuery.getHorrorThemes(),
  ]);

  return (
    <main>
      <ThemeCarousel
        eyebrow="Hot Right Now"
        title="요즘 핫한 테마"
        listType="hot"
        initialThemes={hotThemes}
      />
      <ThemeCarousel
        eyebrow="Spine Chilling"
        title="오싹오싹한 공포 테마"
        listType="horror"
        initialThemes={horrorThemes}
      />
    </main>
  );
}
