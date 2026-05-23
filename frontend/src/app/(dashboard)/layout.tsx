'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { navigationConfig } from '@/config/navigation.config';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t, tp } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) return null;

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  const userRole = user?.role?.slug || 'employee';
  const visibleNavItems = navigationConfig.filter(
    (item) => item.roles.includes(userRole),
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navContent = (
    <nav className="flex flex-col gap-1">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-foreground">GLAdmin</h2>
        <p className="text-xs text-muted-foreground">
          {user?.firstName} {user?.lastName}
        </p>
      </div>
      <Separator className="mb-2" />
      {visibleNavItems.map((item) => {
        const Icon = item.icon as React.ComponentType<{ className?: string }>;
        const isActive = pathname.startsWith(item.path);
        return (
          <Button
            key={item.path}
            variant={isActive ? 'secondary' : 'ghost'}
            className="justify-start gap-3"
            onClick={() => {
              router.push(item.path);
              setMobileOpen(false);
            }}
          >
            <Icon className="h-4 w-4" />
            {t(`nav.${item.key}`)}
          </Button>
        );
      })}
    </nav>
  );

  const currentPage = navigationConfig.find((item) => pathname.startsWith(item.path));
  const pageTitle = currentPage ? t(`nav.${currentPage.key}`) : '';
  const showWelcome = pathname === '/dashboard';

  return (
    <div className="flex min-h-screen">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            {navContent}
          </SheetContent>
        </Sheet>
        <span className="font-semibold">GLAdmin</span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.firstName?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {user?.firstName} {user?.lastName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[260px] md:flex-col md:border-r md:bg-background md:p-4">
        {navContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-6">
          {/* Desktop top bar */}
          <div className="hidden md:flex md:items-center md:justify-end md:mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.firstName?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  {user?.firstName} {user?.lastName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            {showWelcome && (
              <p className="text-muted-foreground mt-1">
                {tp('dashboard.welcome', { name: `${user?.firstName} ${user?.lastName}` })}
              </p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
