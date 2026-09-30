export interface HotTheme {
  id: string;
  rank: number;
  name: string;
  branchName: string;
  liked: boolean;
}

export type getHotThemesResponse = HotTheme[];
