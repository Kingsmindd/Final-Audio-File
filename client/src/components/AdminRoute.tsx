import React from "react";
import { useAuth } from "../context/AuthContext";
import RollerLoader from "./RollerLoader";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RollerLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
