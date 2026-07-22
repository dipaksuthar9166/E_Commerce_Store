import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-slate-900">
      <TopNav toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 relative max-w-[1600px] w-full mx-auto">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main className="flex-1 w-full min-w-0 pb-24 md:pb-8 overflow-x-hidden">
          <div className="w-full px-3 sm:px-4 md:px-6 md:py-5 py-3">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default MainLayout;
