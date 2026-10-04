/**
 * Domain Constants and Shared Fallbacks for PhongTroXanh
 */

export const roomImages: string[] = [
  "https://images.unsplash.com/photo-1641232458416-feace752b346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1622429420441-60dd67f737a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1529408632839-a54952c491e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1674230227190-05b589f2f730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1599243272864-e9dd455966bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1730154838429-642ab631e311?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1737737210863-387afd35344e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1745429523615-2a82c60bfc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

export const peopleImages: string[] = [
  "https://images.unsplash.com/photo-1611403119860-57c4937ef987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1769961982389-bb243681421a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1773899337978-b8d83bd9b783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1761933808230-9a2e78956daa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "https://images.unsplash.com/photo-1771757019737-4468ded75c97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
];

export const amenityPool: string[] = [
  "Máy lạnh",
  "Wi-Fi",
  "Giờ tự do",
  "WC riêng",
  "Bãi xe",
  "Gác lửng",
  "Bếp riêng",
  "Ban công",
  "Thang máy",
  "An ninh 24/7",
];

export const districts: string[] = [
  "Quận 1",
  "Quận 3",
  "Quận 5",
  "Quận 7",
  "Quận 9",
  "Quận 10",
  "Bình Thạnh",
  "Thủ Đức",
  "Gò Vấp",
  "Tân Bình",
  "Phú Nhuận",
];

export const roomTypes: string[] = [
  "Phòng trọ",
  "Phòng khép kín",
  "Studio",
  "Căn hộ mini",
  "Ở ghép",
];

export const interestOptions: string[] = [
  "Thể thao",
  "Nấu ăn",
  "Gaming",
  "Đọc sách",
  "Âm nhạc",
  "Gym",
  "Phim ảnh",
  "Thú cưng",
  "Nghệ thuật",
  "Công nghệ",
  "Nhiếp ảnh",
  "Du lịch",
];

export type SystemContract = {
  month: string;
  contracts: number;
  roomsRented: number;
};

export const systemContractsMock: SystemContract[] = [
  { month: "T1", contracts: 145, roomsRented: 120 },
  { month: "T2", contracts: 189, roomsRented: 155 },
  { month: "T3", contracts: 220, roomsRented: 198 },
  { month: "T4", contracts: 310, roomsRented: 280 },
  { month: "T5", contracts: 420, roomsRented: 395 },
  { month: "T6", contracts: 512, roomsRented: 480 },
];

export type RevenueInsightBreakdown = {
  subscriptions: number;
  boosts: number;
  priorityMatching: number;
  bannerAds: number;
};

export type RevenueInsight = {
  period: string;
  totalRevenue: number;
  breakdown: RevenueInsightBreakdown;
};

export const revenueInsightsMock: Record<string, RevenueInsight[]> = {
  "3months": [
    { period: "Tháng 4", totalRevenue: 12800000, breakdown: { subscriptions: 6000000, boosts: 3800000, priorityMatching: 2000000, bannerAds: 1000000 } },
    { period: "Tháng 5", totalRevenue: 18450000, breakdown: { subscriptions: 9000000, boosts: 5450000, priorityMatching: 2500000, bannerAds: 1500000 } },
    { period: "Tháng 6", totalRevenue: 24810000, breakdown: { subscriptions: 12500000, boosts: 7310000, priorityMatching: 3500000, bannerAds: 1500000 } },
  ],
  "6months": [
    { period: "Tháng 1", totalRevenue: 6200000, breakdown: { subscriptions: 3000000, boosts: 2000000, priorityMatching: 800000, bannerAds: 400000 } },
    { period: "Tháng 2", totalRevenue: 8900000, breakdown: { subscriptions: 4500000, boosts: 2800000, priorityMatching: 1000000, bannerAds: 600000 } },
    { period: "Tháng 3", totalRevenue: 10500000, breakdown: { subscriptions: 5000000, boosts: 3500000, priorityMatching: 1200000, bannerAds: 800000 } },
    { period: "Tháng 4", totalRevenue: 12800000, breakdown: { subscriptions: 6000000, boosts: 3800000, priorityMatching: 2000000, bannerAds: 1000000 } },
    { period: "Tháng 5", totalRevenue: 18450000, breakdown: { subscriptions: 9000000, boosts: 5450000, priorityMatching: 2500000, bannerAds: 1500000 } },
    { period: "Tháng 6", totalRevenue: 24810000, breakdown: { subscriptions: 12500000, boosts: 7310000, priorityMatching: 3500000, bannerAds: 1500000 } },
  ],
  "year": [
    { period: "Q1/2026", totalRevenue: 25600000, breakdown: { subscriptions: 12500000, boosts: 8300000, priorityMatching: 3000000, bannerAds: 1800000 } },
    { period: "Q2/2026", totalRevenue: 56060000, breakdown: { subscriptions: 27500000, boosts: 16560000, priorityMatching: 8000000, bannerAds: 4000000 } },
  ],
};
