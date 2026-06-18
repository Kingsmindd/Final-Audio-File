import React from "react";
import { Link } from "react-router-dom";

const heroImg =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780575537/heroImg_vbfvtl.png";
const HeroSection: React.FC = () => {
  return (
    <header className="bg-[#131313] relative overflow-hidden">
      <div className="px-6 sm:px-[clamp(1rem,11.40vw,200px)] md:px-10 lg:px-12 xl:px-[5.5%]">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-132 md:min-h-182.25 lg:min-h-157.75 py-16 md:py-20 lg:py-0 relative">
          <div className="flex flex-col items-center lg:items-start lg:text-left  gap-4 lg:gap-14 z-10 max-w-95 mt-15">
            <div className="flex flex-col lg:gap-6 gap-4">
              <p className="text-[14px] tracking-[10px] text-white/50 upercase">
                New Product
              </p>
              <h1 className="text-[36px] font-bold md:text-[56px] leading-tight tracking-[2px] uppercase text-white ">
                XX99 Mark II <br className="hidden md:inline" />
                Headphones{" "}
              </h1>

              <p className="text-[15px] leading-relaxed text-white/50 max-w-99">
                Experience natural, lifelike audio and exeptional build quality
                made for passionate music enthhusiast
              </p>
            </div>

            <div className="md:flex-row items-center md:gap-5 flaex-col gap-2 flex">
              <Link to="/headphones">
                <button className="bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase px-8 py-4 hover:bg-[#FBAF85] transition-colors duration-200 cursor-pointer ">
                  See Product
                </button>
              </Link>
              <Link to="/register">
                <button className="text-[16px] font-bold text-white tracking-[1px] hover:text-[#D87D4A] transition-colors upprecase w-full md:w-fit py-2.5 lg:px-5 border border-[#FFFFFF]">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>

          <div className="lg:flex md:flex w-full lg:w-[55%] right-20 -top-15 lg:-top-15 lg:right-17.5 mt-8 lg:mt-0 md:top-37.5 absolute ">
            <img
              src={heroImg}
              alt=""
              className="max-w-125 lg:max-w-none max-auto  lg-mx-0 z-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
