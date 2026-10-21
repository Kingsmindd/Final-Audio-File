import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import RollerLoader from "./RollerLoader";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RollerLoader />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
