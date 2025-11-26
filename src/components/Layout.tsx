import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { DesktopDock } from './DesktopDock';
import { AIChatDialog } from './ai';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />

      {/* Main content with responsive padding */}
      {/* pb-20 for bottom nav on mobile/tablet, pb-28 for dock on desktop */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 lg:pb-28">
        <Outlet />
      </main>

      {/* Footer - hidden on all screens to make room for dock/bottom nav */}
      <div className="hidden">
        <Footer />
      </div>

      {/* Mobile/Tablet Bottom Navigation (< 1024px) */}
      <MobileBottomNav />

      {/* Desktop Dock (>= 1024px) */}
      <DesktopDock />

      {/* AI Chat Dialog - Global */}
      <AIChatDialog />
    </div>
  );
};

export default Layout;
