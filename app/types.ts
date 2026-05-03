export interface PartyResult {
  party: string;
  won: number;
  leading: number;
  total: number;
  voteShare: number;
}

export interface ElectionData {
  state: string;
  totalSeats: number;
  majorityMark: number;
  countingStatus: string;
  lastUpdated: string;
  parties: PartyResult[];
  dataSource: "live" | "mock" | "cached";
  cacheAge?: number;
  error?: string;
}

export interface PartyConfig {
  name: string;
  shortName: string;
  cardClass: string;
  accentColor: string;
  chartColor: string;
  icon: string;
}

export const PARTY_CONFIGS: Record<string, PartyConfig> = {
  DMK: {
    name: "Dravida Munnetra Kazhagam",
    shortName: "DMK",
    cardClass: "party-card-dmk",
    accentColor: "#CC0000",
    chartColor: "#DC2626",
    icon: "☀",
  },
  AIADMK: {
    name: "All India Anna Dravida Munnetra Kazhagam",
    shortName: "AIADMK",
    cardClass: "party-card-aiadmk",
    accentColor: "#00AA00",
    chartColor: "#16A34A",
    icon: "🌿",
  },
  TVK: {
    name: "Tamilaga Vettri Kazhagam",
    shortName: "TVK",
    cardClass: "party-card-tvk",
    accentColor: "#FFD700",
    chartColor: "#F59E0B",
    icon: "⭐",
  },
  NTK: {
    name: "Nam Tamilar Katchi",
    shortName: "NTK",
    cardClass: "party-card-ntk",
    accentColor: "#FF6600",
    chartColor: "#EA580C",
    icon: "🔥",
  },
  Others: {
    name: "Other Parties & Independents",
    shortName: "Others",
    cardClass: "party-card-others",
    accentColor: "#64748B",
    chartColor: "#475569",
    icon: "◆",
  },
};

export const TOTAL_SEATS = 234;
export const MAGIC_NUMBER = 118;
