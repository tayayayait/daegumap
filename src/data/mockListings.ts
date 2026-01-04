import { Listing, Category } from '@/types/listing';
import cafeImage from '@/assets/listing-cafe.jpg';
import restaurantImage from '@/assets/listing-restaurant.jpg';
import officeImage from '@/assets/listing-office.jpg';

// 대구 주요 지역 좌표
const daeguCoords = {
  center: { lat: 35.8714, lng: 128.6014 }, // 대구시청
  dongseongro: { lat: 35.8676, lng: 128.5936 },
  suseong: { lat: 35.8566, lng: 128.6304 },
  buk: { lat: 35.8861, lng: 128.5828 },
  dalseong: { lat: 35.7747, lng: 128.4313 },
  dalseo: { lat: 35.8298, lng: 128.5327 },
};

const categories: Category[] = ['음식점', '카페', '편의점', '미용실', '병원', '학원', '사무실', '기타'];

const dongs = [
  '중구 동성로',
  '중구 삼덕동',
  '수성구 범어동',
  '수성구 수성동',
  '북구 칠성동',
  '달서구 상인동',
  '달서구 월성동',
  '동구 신천동',
  '남구 대명동',
];

const thumbnails = [cafeImage, restaurantImage, officeImage];
const thumbnailLqipMap: Record<string, string> = {
  [cafeImage]:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAYACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5z+Fl3rmvjUNgs40sLdZ3LQM5KltvqPrXsXhHXJ7iNBDq2hjJyA8XI/8AIlZn7O2g2dppHj+91G3lms7bQxNJHbvslZQ2SEbPDccV51oF34Zh1O8W2tFspbiVltZJBOJHzIVXJDld2euOM5r8xr4eUptxTtpsr/efpdDEJU0pNX83Y+tLDQvEt/YJPb3GizxscK0dsWBPpkSVzum6B471P4mSaXpdvot6bO1F1dzyo0UMK79mCctkhuoGfTrnHdab4f8AEvhzwK94LoxWcPiOK1MXSSVWdNyb2JI4J56j1rb1RtdtfF/i+4tnsdENt4VBH2eIymCJbgsAgYBS+T1K49mPNaYSi6mtVaXWnk7nPisR7O6pvo9fNW/zM/4SfCPwhoHg7xSuoeJdH11tSsoLf7NZXX7pPnBxI+MhT3PA7V2+nfs5eHY/D9kYNJ8LG9dUhhvLe7MuLgjIKYXOc7iMCiivb+p05Sbk3p5v16HhSxVSMFa2vl8jd8WfBzxJq51GCUarJZ3TmdIbK4XyoZiABIPMXdvG3lu+eORXP3vwu8a2FxqNvp+i3NxZzaNb6Ysl4vmzXOZwZVb5uPl3HeW78YxRRXV9Vp2stNUcKxM1LmfZr7z/2Q==",
  [officeImage]:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAYACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9GJ9BD4hMURjaJAVMS/3R7daRLCSOTHmSN6HzsZ9/u15n8Ivjd4XsvhPaa94j8VwWNnJqM1lFc61dBXV9x8uBixJ3YHAJ6V4Jrn7R9/rXxKk0/wAIeLoZDNcyPc2VnH9r8lyV28lTsXaD7CuCpXUKUaqi2mr6a2OulQVWpKmppW6t2TPtZNPnVGcM+EUsSZhwMdeVFcP4K8XXHxK0O3bT9MXRNKaZon+0lC8qjP8AdHAJBJ5yfUVwPwz+JetXlj4lTxX4iiu0g1BLKAvGI4kzHu2MEUbmB9Tj3q54G0mO10rSBdXJubBJd0dukuYGG8fMwHDkgnrkAds1jDESq1aagrKV9/K3+ZpUowo06nM7uNtvO55t4W/ZGubjwLL4UtJhe6DewSNKssJiRGnQl1QqVAClxtIG75Vr1T4O/Byz+GD2tneFLu4sbaOyW8SFifKRQME5YM2R97GaKK9dRivdS0R5V3bmPT9a8IWHiSIB7e7mtxIJkARApO0qeCv+FZvhD4ReH/DHhbStD0u0vrWxstyxpMdx5fc278ec0UVHKkzS91qf/9k=",
  [restaurantImage]:
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAYACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5m+FGjjRbXUr270m+8SRXyrcLfwac08MyxnbKysR1DMFbHevrTWfi/wDCiWGS4i/Zkvba1RvKx/wj9qwSRcFlZwDkEEehzjB5r50/Z0+N/iXXdCsvC2l+GtOYWsN86XVxOyGZSyzSBjjG5cAKB13dq9Kb4rePrFr7wxBpmn31vNA15PBa6kDERtJY7iOHAXGOvAHtXwmPzDH0cZOFOEeT1V9vNrrc+3wmDwE8NFzk+b5pNX30T6WO1l+Mnwc0LxH5eofszXb2+x4jYnw/aBjJ98Hdnsn4fjXzrqHxX8J+F/GM+qnwlf6RolytzcJpv9niF2gl3/Zot3AIVjHnthD+PtGveIPiFraf2DdyaNp9tBZqNlzekKIocMo3bM5LMAMdTx2r5a8U/Ex/iB4P1kQ6ctvJaQi4NxKcklJFwuMn1P5VpleYYrF14xaTiviasmm0+ilK/wB5lmOCwmGw82m1J7LVpq66tKxD4Ci8ZfDDSU1W10DVIrhfO8uGC33q8cqgMDuU4yAOQM8V2VhrnjvUxqV1NouqwT6nZqjw+Syo20ttVwPvYBHJA6dOKKK+oxWW0Jtzle78z5vC5lXglFWsvK/5ne6T4T+K8LW15ZadBb2F1b7WkOpIj7ZOW3ROchec7NoYY65FeG6j8JfGWkaRf2lx4Zu5HuBJBAtuBJ5hxjJ2k7RgZy2OtFFc2W5dhqdSUoRs3v52vv8Aeb5nmOIqwUZu69PT/I//2Q==",
};

const generateRandomListing = (index: number): Listing => {
  const dong = dongs[Math.floor(Math.random() * dongs.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const status = ['active', 'active', 'active', 'negotiation', 'completed'][
    Math.floor(Math.random() * 5)
  ] as Listing['status'];

  const baseCoords = Object.values(daeguCoords)[Math.floor(Math.random() * Object.keys(daeguCoords).length)];
  const latOffset = (Math.random() - 0.5) * 0.03;
  const lngOffset = (Math.random() - 0.5) * 0.03;

  const premium = Math.floor(Math.random() * 15000) + 1000;
  const deposit = Math.floor(Math.random() * 5000) + 500;
  const monthlyRent = Math.floor(Math.random() * 400) + 50;
  const areaM2 = Math.floor(Math.random() * 100) + 20;

  const daysAgo = Math.floor(Math.random() * 30);
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  const thumbnailUrl = thumbnails[index % thumbnails.length];
  const thumbnailLqipUrl = thumbnailLqipMap[thumbnailUrl];

  return {
    id: `listing-${index}`,
    title: `${dong} ${category} 매물`,
    dong,
    address: `대구광역시 ${dong} ${Math.floor(Math.random() * 100) + 1}-${Math.floor(Math.random() * 50) + 1}`,
    addressDetail: `${Math.floor(Math.random() * 5) + 1}층`,
    category,
    status,
    premium,
    deposit,
    monthlyRent,
    areaM2,
    areaPyeong: Math.round(areaM2 * 0.3025 * 10) / 10,
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
    thumbnailUrl,
    thumbnailLqipUrl,
    imageUrls: [],
    createdAt,
    updatedAt: createdAt,
    note: Math.random() > 0.5 ? '즉시 입주 가능, 인테리어 상태 양호' : undefined,
    isNew: daysAgo < 7,
  };
};

export const mockListings: Listing[] = Array.from({ length: 24 }, (_, i) => 
  generateRandomListing(i)
);

// 실제 대구 매물 데이터 (이미지 포함)
export const featuredListings: Listing[] = [
  {
    id: 'featured-1',
    title: '동성로 핵심상권 1층 카페',
    dong: '중구 동성로',
    address: '대구광역시 중구 동성로2길 15',
    addressDetail: '1층 전체',
    category: '카페',
    status: 'active',
    premium: 8500,
    deposit: 3000,
    monthlyRent: 180,
    areaM2: 66,
    areaPyeong: 20,
    lat: 35.8676,
    lng: 128.5936,
    thumbnailUrl: cafeImage,
    thumbnailLqipUrl: thumbnailLqipMap[cafeImage],
    imageUrls: [],
    createdAt: new Date('2024-12-28'),
    updatedAt: new Date('2024-12-28'),
    note: '유동인구 최상, 대형 테라스 보유',
    isNew: true,
  },
  {
    id: 'featured-2',
    title: '수성구 학원가 사무실',
    dong: '수성구 범어동',
    address: '대구광역시 수성구 범어동 123-45',
    addressDetail: '3층',
    category: '학원',
    status: 'active',
    premium: 5000,
    deposit: 2000,
    monthlyRent: 120,
    areaM2: 99,
    areaPyeong: 30,
    lat: 35.8566,
    lng: 128.6304,
    thumbnailUrl: officeImage,
    thumbnailLqipUrl: thumbnailLqipMap[officeImage],
    imageUrls: [],
    createdAt: new Date('2024-12-30'),
    updatedAt: new Date('2024-12-30'),
    note: '학원가 핵심입지, 주차 편리',
    isNew: true,
  },
  {
    id: 'featured-3',
    title: '칠성시장 인근 음식점',
    dong: '북구 칠성동',
    address: '대구광역시 북구 칠성동1가 88',
    addressDetail: '1층',
    category: '음식점',
    status: 'negotiation',
    premium: 12000,
    deposit: 5000,
    monthlyRent: 250,
    areaM2: 132,
    areaPyeong: 40,
    lat: 35.8861,
    lng: 128.5828,
    thumbnailUrl: restaurantImage,
    thumbnailLqipUrl: thumbnailLqipMap[restaurantImage],
    imageUrls: [],
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-31'),
    note: '시장 유동인구, 즉시 영업 가능',
    isNew: false,
  },
];

export const allListings = [...featuredListings, ...mockListings];
