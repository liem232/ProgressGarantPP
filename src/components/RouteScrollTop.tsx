import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteScrollTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Плавный скролл наверх при смене пути
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default RouteScrollTop;
