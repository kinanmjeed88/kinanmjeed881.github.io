
export interface ChannelData {
  id: string;
  name: string;
  description: string;
  url: string;
  isFolder?: boolean;
  iconType?: 'telegram' | 'folder' | 'ai';
}

export interface SocialData {
  id: string;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube';
  url: string;
}

export interface AITool {
  id: string;
  name: string;
  category: string;
  country: string;
  company: string;
  description: string[];
  free_note?: string;
  official_url: string;
}

export interface ArticleItem {
  id: number;
  title: string;
  content: string;
  date?: string;
}

export interface PhoneNewsItem {
  phone_name: string;
  brand: string;
  release_date: string;
  specifications: Record<string, string>;
  official_specs_link?: string;
  iraqi_price_source?: string;
  pros: string[];
  cons: string[];
  copy_payload?: string;
}

export interface PhoneComparisonResult {
  phone1_name: string;
  phone2_name: string;
  comparison_points: {
    feature: string;
    phone1_val: string;
    phone2_val: string;
    winner?: 1 | 2 | 0; // 0 for tie/neutral
  }[];
  verdict: string;
}

export interface StatsChart {
  title: string;
  description: string;
  chart_type: 'bar' | 'pie' | 'list';
  data: {
    label: string;
    value: number; 
    displayValue: string; 
    color?: string;
  }[];
}

export interface StatsResult {
  main_insight: string;
  charts: StatsChart[];
}

export interface LocalPhone {
  id: string;
  name: string;
  release_year: number;
  category: string;
  manufacturing: {
    frame: string;
    back: string;
    protection: string;
    water_resistance: string;
  };
  specs: {
    display: {
      size?: string;
      type?: string;
      resolution?: string;
      refresh_rate?: string;
      main?: string;
      cover?: string;
    };
    chipset: string;
    ram: string;
    storage: string;
    rear_camera: string;
    front_camera: string;
    battery: string;
    charging: string;
    weight: string;
    os: string;
  };
}

export interface BrandFile {
  brand: string;
  country: string;
  phones: LocalPhone[];
}
