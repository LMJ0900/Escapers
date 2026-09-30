import { ThemeQuery } from "@/api/domain/theme/Theme.query";

import ThemeCarousel from "./_component/ThemeCarousel/ThemeCarousel";

export default async function Home() {
  const [hotThemes, horrorThemes, activeThemes] = await Promise.all([
    ThemeQuery.getHotThemes(),
    ThemeQuery.getHorrorThemes(),
    ThemeQuery.getActiveThemes(),
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
      <ThemeCarousel
        eyebrow="Get Moving"
        title="활동성 높은 테마"
        listType="active"
        initialThemes={activeThemes}
      />
    </main>
  );
}
