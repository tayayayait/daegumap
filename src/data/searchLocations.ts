export type SearchLocation = {
  label: string;
  center: { lat: number; lng: number };
  zoom?: number;
  bounds?: { north: number; south: number; east: number; west: number };
};

export const searchLocations: SearchLocation[] = [
  { label: "중구 동성로", center: { lat: 35.8676, lng: 128.5936 }, zoom: 15 },
  { label: "수성구 범어동", center: { lat: 35.8566, lng: 128.6304 }, zoom: 15 },
  { label: "북구 칠성동", center: { lat: 35.8861, lng: 128.5828 }, zoom: 15 },
  { label: "서구 내당동", center: { lat: 35.8632, lng: 128.553 }, zoom: 15 },
  { label: "달서구 본리동", center: { lat: 35.8473, lng: 128.5378 }, zoom: 15 },
  { label: "달성군 다사읍", center: { lat: 35.8623, lng: 128.4653 }, zoom: 14 },
];
