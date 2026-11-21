import { Outlet } from 'react-router-dom';
import { Header, Footer } from './index';
import { CartDrawer } from '@/components/ui';
import { EmailVerificationNotice } from '@/components/auth';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Header />
      <EmailVerificationNotice />

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
