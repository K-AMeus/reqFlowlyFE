import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface ScrollToTopProps {
  children: React.ReactNode;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return <>{children}</>;
};

export default ScrollToTop;
