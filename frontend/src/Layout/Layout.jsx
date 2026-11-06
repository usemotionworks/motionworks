import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../Components/Loading";

const Layout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Match this with your animation duration

    return () => clearTimeout(timer);
  }, [location.key]); // Trigger on route change

  return (
    <>
      {isLoading && <Loading />}
      <div
        className={`transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"}`}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;
