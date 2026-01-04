import { Menu, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapSearchInput } from "@/components/map/MapSearchInput";
import type { MapSearchSelection } from "@/components/map/MapSearchInput";
import type { UserRole } from "@/types/listing";

interface TopBarProps {
  onFilterClick?: () => void;
  onSearchSelect?: (selection: MapSearchSelection) => void;
  userRole?: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  guest: "게스트",
  member: "회원",
  partner: "파트너",
  staff: "직원",
  master: "마스터",
};

const roleMenus: Record<UserRole, { label: string; to: string }[]> = {
  guest: [
    { label: "로그인", to: "/login" },
    { label: "회원가입", to: "/signup" },
  ],
  member: [
    { label: "프로필", to: "/profile" },
  ],
  partner: [
    { label: "프로필", to: "/profile" },
    { label: "매물 등록", to: "/register" },
    { label: "파트너 콘솔", to: "/partner" },
  ],
  staff: [
    { label: "프로필", to: "/profile" },
    { label: "백오피스", to: "/backoffice" },
  ],
  master: [
    { label: "관리자 페이지", to: "/admin" },
    { label: "백오피스", to: "/backoffice" },
    { label: "프로필", to: "/profile" },
  ],
};

export function TopBar({ onFilterClick, onSearchSelect, userRole = "guest" }: TopBarProps) {
  const menuItems = roleMenus[userRole];
  const canRegister =
    userRole === "partner" || userRole === "staff" || userRole === "master";

  return (
    <header className="fixed top-0 left-0 right-0 h-header bg-card border-b border-border z-sticky">
      <div className="h-full flex items-center px-4 lg:px-6 gap-3">
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DG</span>
          </div>
          <span className="font-semibold text-foreground">대구상가</span>
        </div>

        <div className="flex-1 min-w-0 md:max-w-xl md:mx-auto">
          <MapSearchInput
            className="w-full"
            placeholder="지역, 상권을 검색하세요"
            onSelect={onSearchSelect}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            variant={canRegister ? "default" : "outline"}
            className="hidden md:inline-flex"
            title={canRegister ? undefined : "파트너/직원 전용"}
          >
            <Link to="/register">매물 등록</Link>
          </Button>

          {onFilterClick && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onFilterClick}
              aria-label="필터 열기"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label="사용자 메뉴"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{roleLabels[userRole]} 메뉴</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {menuItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="w-full">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
