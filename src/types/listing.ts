// 매물 관련 타입 정의

export type ListingStatus = 
  | 'active'       // 게시중
  | 'negotiation'  // 예약/협의중
  | 'completed'    // 계약완료
  | 'archived';    // 만료/비공개

export type Category = 
  | '음식점'
  | '카페'
  | '편의점'
  | '미용실'
  | '병원'
  | '학원'
  | '사무실'
  | '기타';

export interface Listing {
  id: string;
  title: string;
  dong: string;           // 동 (예: 중구 동성로)
  address: string;        // 전체 주소
  addressDetail?: string; // 상세 주소 (층/호) - 권한별 노출
  category: Category;
  status: ListingStatus;
  
  // 금액 정보 (권한별 마스킹)
  premium: number;        // 권리금 (만원)
  deposit: number;        // 보증금 (만원)
  monthlyRent: number;    // 월세 (만원)
  
  // 면적
  areaM2: number;         // 전용면적 (㎡)
  areaPyeong: number;     // 전용면적 (평)
  
  // 위치
  lat: number;
  lng: number;
  
  // 이미지
  thumbnailUrl: string;
  thumbnailLqipUrl?: string;
  imageUrls: string[];
  
  // 메타
  createdAt: Date;
  updatedAt: Date;
  ownerContact?: string;
  contractNotes?: string;
  closingDate?: string;
  note?: string;
  isNew?: boolean;        // 7일 이내 등록
}

export interface ListingFilter {
  premiumMin?: number;
  premiumMax?: number;
  depositMin?: number;
  depositMax?: number;
  monthlyRentMin?: number;
  monthlyRentMax?: number;
  areaMin?: number;
  areaMax?: number;
  categories?: Category[];
  sort?: 'latest' | 'rent_low' | 'premium_low';
}

// 사용자 역할
export type UserRole = 'guest' | 'member' | 'partner' | 'staff' | 'master';

// 가시성 레벨
export type VisibilityLevel = 'full' | 'masked' | 'range' | 'hidden' | 'summary';

// 권한별 필드 가시성
export const fieldVisibility: Record<string, Record<UserRole, VisibilityLevel>> = {
  premium: {
    guest: 'masked',
    member: 'masked',
    partner: 'full',
    staff: 'full',
    master: 'full'
  },
  deposit: {
    guest: 'range',
    member: 'range',
    partner: 'full',
    staff: 'full',
    master: 'full'
  },
  monthlyRent: {
    guest: 'range',
    member: 'full',
    partner: 'full',
    staff: 'full',
    master: 'full'
  },
  ownerContact: {
    guest: 'hidden',
    member: 'hidden',
    partner: 'masked',
    staff: 'full',
    master: 'full'
  },
  addressDetail: {
    guest: 'hidden',
    member: 'hidden',
    partner: 'full',
    staff: 'full',
    master: 'full'
  }
};
