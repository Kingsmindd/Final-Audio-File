import React from "react";
import CategoryPageLayout from "../components/CategoryPageLayout";
import { useStore } from "../context/StoreContext";
import RollerLoader from "../components/RollerLoader";

const EarphonesPage: React.FC = () => {
  const { getProductsByCategory, loading } = useStore();

  if (loading) {
    return <RollerLoader />;
  }

  const earphones = getProductsByCategory("earphones");
  
  return <CategoryPageLayout title="Earphones" products={earphones} />;
};

export default EarphonesPage;
