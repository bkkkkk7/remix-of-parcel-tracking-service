export type CarrierCode = "cjlogistics" | "lotte" | "hanjin";

export type TrackingEvent = {
  time: string; // ISO string
  location: string;
  status:
    | "접수"
    | "집화"
    | "이동중"
    | "허브 도착"
    | "허브 출발"
    | "배송출발"
    | "배송완료"
    | "보류";
  note?: string;
};

export type TrackingResult = {
  carrier: CarrierCode;
  carrierName: string;
  trackingNumber: string;
  currentStatus: TrackingEvent["status"];
  estimatedDelivery?: string; // ISO date
  history: TrackingEvent[]; // newest last
  sender?: string;
  recipient?: string;
};

// Simple mock DB: carrier -> trackingNumber -> result
const mockDB: Record<CarrierCode, Record<string, TrackingResult>> = {
  cjlogistics: {
    "123456789012": {
      carrier: "cjlogistics",
      carrierName: "CJ대한통운",
      trackingNumber: "123456789012",
      currentStatus: "배송출발",
      estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      sender: "서울 강남물류센터",
      recipient: "부산 해운대구 김민수",
      history: [
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
          location: "서울 성동구",
          status: "접수",
          note: "온라인 스토어 접수",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
          location: "서울 강남집배점",
          status: "집화",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          location: "수원 허브",
          status: "허브 도착",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
          location: "수원 허브",
          status: "허브 출발",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          location: "부산 해운대 집배점",
          status: "이동중",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          location: "부산 해운대 집배점",
          status: "배송출발",
        },
      ],
    },
  },
  lotte: {
    "876543210987": {
      carrier: "lotte",
      carrierName: "롯데택배",
      trackingNumber: "876543210987",
      currentStatus: "이동중",
      sender: "대전 물류센터",
      recipient: "인천 연수구 박지현",
      history: [
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          location: "대구",
          status: "접수",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 42).toISOString(),
          location: "대전 허브",
          status: "허브 도착",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
          location: "대전 허브",
          status: "허브 출발",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          location: "인천 연수구",
          status: "이동중",
        },
      ],
    },
  },
  hanjin: {
    "110022003300": {
      carrier: "hanjin",
      carrierName: "한진택배",
      trackingNumber: "110022003300",
      currentStatus: "배송완료",
      estimatedDelivery: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      sender: "광주 북구",
      recipient: "서울 마포구 최유진",
      history: [
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
          location: "광주 북구",
          status: "접수",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
          location: "광주 허브",
          status: "집화",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
          location: "천안 허브",
          status: "허브 도착",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
          location: "천안 허브",
          status: "허브 출발",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          location: "서울 마포구",
          status: "배송출발",
        },
        {
          time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          location: "서울 마포구",
          status: "배송완료",
        },
      ],
    },
  },
};

export function searchMockTracking(
  carrier: CarrierCode,
  trackingNumber: string
): TrackingResult | null {
  const byCarrier = mockDB[carrier];
  if (!byCarrier) return null;
  return byCarrier[trackingNumber] ?? null;
}

export const CARRIERS: { code: CarrierCode; name: string }[] = [
  { code: "cjlogistics", name: "CJ대한통운" },
  { code: "lotte", name: "롯데택배" },
  { code: "hanjin", name: "한진택배" },
];