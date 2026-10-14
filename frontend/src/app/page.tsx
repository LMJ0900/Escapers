import { ThemeQuery } from "@/api/domain/theme/Theme.query";

import ThemeCarousel from "./_component/ThemeCarousel/ThemeCarousel";

export default async function Home() {
  const [hotThemes, horrorThemes, activeThemes] = await Promise.all([
    ThemeQuery.getThemeCollection("hot"),
    ThemeQuery.getThemeCollection("horror"),
    ThemeQuery.getThemeCollection("active"),
  ]);

  return (
    <main>
      <ThemeCarousel
        eyebrow="Hot Right Now"
        title="요즘 핫한 테마"
        collectionType="hot"
        initialThemes={hotThemes}
      />
      <ThemeCarousel
        eyebrow="Spine Chilling"
        title="오싹오싹한 공포 테마"
        collectionType="horror"
        initialThemes={horrorThemes}
      />
      <ThemeCarousel
        eyebrow="Get Moving"
        title="활동성 높은 테마"
        collectionType="active"
        initialThemes={activeThemes}
      />
    </main>
  );
}
