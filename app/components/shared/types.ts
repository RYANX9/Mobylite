// components/shared/types.ts
export interface Phone {
  id: number;
  brand: string;
  model_name: string;
  price_usd?: number;
  main_image_url?: string;
  release_date_full?: string;
  release_year?: number;
  release_month?: number;
  release_day?: number;
  ram_options?: number[];
  storage_options?: number[];
  battery_capacity?: number;
  main_camera_mp?: number;
  chipset?: string;
  screen_size?: number;
  [key: string]: any;
}

export interface Filters {
  min_price: number | null;
  max_price: number | null;
  min_ram: number | null;
  min_battery: number | null;
  min_camera_mp: number | null;
  min_year: number | null;
  brands: string[];
  has_5g: boolean | null;
  min_storage: number | null;
  screen_size: string | null;
  os: string | null;
}

export interface Recommendation {
  id: string;
  label: string;
  icon: any;
  desc?: string;
}


// --------------- REVIEWS ---------------
export interface Review {
  id: string;
  phoneId: string;
  userId: string;
  userName: string;
  rating: number;          // 0.5 – 5.0
  title: string;
  body: string;
  createdAt: string;       // ISO
}

// --------------- ALSO COMPARED ---------------
export interface AlsoComparedResponse {
  phoneId: string;
  alsoComparedIds: string[];   // length 4 (mock)
}






