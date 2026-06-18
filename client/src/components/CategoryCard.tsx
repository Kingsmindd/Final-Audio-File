import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

interface CategoryCardProp {
  to: string;
  label: string;
  image: string;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProp> = ({
  to,
  label,
  image,
  className = "",
}) => {
  return (
    <Link
      to={to}
      className={`w-full bg-[#F1F1F1] relative rounded-xl h-41.25 lg:h-51 pt-22 lg:pt-30 group cursor-pointer hover:shadow-md transition-shadow ${className}`}
    >
      <div className="absolute top-[-30%] md:top-[-38%] left-1/2 -translate-x-1/2 flex justify-center ">
        <div className="relative">
          <img
            src={image}
            alt=""
            className="relative z-10 w-20 lg:w-30.5 object-cover"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 lg:w-30 h-3.75 lg:h-6.25 rounded-full bg-black blur-[20px] lg:blur-[30px]" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <h4 className="text-[15px] md:text-[18px] font-bold tracking-[1px] text-black">
          {label}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold tracking-[0.5px] uppercase text-blackl/50 group-hover:text-[#D87D4A] transition-colors">
            Shop
          </span>
          <FaChevronRight className="text-lg text-[#D87D4A]" />
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
