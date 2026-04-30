import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import AgeVerification from './AgeVerification';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header transparent={isHomePage} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <AgeVerification />
    </div>
  );
};

export default Layout;