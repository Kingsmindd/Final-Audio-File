import React from "react";
import CategoryPageLayout from "../components/CategoryPageLayout";
import { useStore } from "../context/StoreContext";
import RollerLoader from "../components/RollerLoader";

const HeadphonesPage: React.FC = () => {
  // Get headphone products from context (alreday fetched globally)
  const { getProductsByCategory, loading } = useStore();

  if (loading) {
    return <RollerLoader />;
  }
  const headphones = getProductsByCategory("headphones");
  return <CategoryPageLayout title="Headphones" products={headphones} />;
};

export default HeadphonesPage;
