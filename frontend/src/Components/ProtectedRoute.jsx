import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import Loading from "./Loading";

const ProtectedRoute = ({ children }) => {
  const { user, checkingAuth } = useUserStore();
  const location = useLocation();

  if (checkingAuth) {
    return <Loading />;
  }

  if (!user) {
    // Save the location they were trying to go to so we can redirect them back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
