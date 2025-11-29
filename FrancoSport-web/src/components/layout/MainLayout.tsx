import { Outlet } from 'react-router-dom';
import { Header, Footer } from './index';
import { CartDrawer } from '@/components/ui';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Cart Drawer - Global */}
      <CartDrawer />
    </div>
  );
};

export default MainLayout;
