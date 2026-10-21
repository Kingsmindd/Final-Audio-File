import React from "react";
import CategoryPageLayout from "../components/CategoryPageLayout";
import { useStore } from "../context/StoreContext";
import RollerLoader from "../components/RollerLoader";

const SpeakerPage: React.FC = () => {
  const { getProductsByCategory, loading } = useStore();

  if (loading) {
    return <RollerLoader />;
  }

  const speakers = getProductsByCategory("speakers");
  return <CategoryPageLayout title="Speakers" products={speakers} />;
};

export default SpeakerPage;
