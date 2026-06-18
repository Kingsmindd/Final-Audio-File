import React from "react";
import HeroSection from "../components/HeroSection";
import CategoryCard from "../components/CategoryCard";
import { Link } from "react-router-dom";
import Man from "../components/Man";

const HOMEZXX9 =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780585291/ZXX9_iaonwi.png";

const desktopCatergoryEarpod =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780583352/desktopCatergoryEarpod_x2ndjm.png";

const desktopCatergoryEarphone =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780583376/desktopCatergoryEarphone_yjnpsv.png";

const desktopCatergorySpeaker =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780583386/desktopCatergorySpeaker_i4eonq.png";

const ZX7mobile =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780914486/ZX7_mobile_home_curpu3.png";

const ZX7desktop =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780914462/ZX7_desktop_2_halaze.png";

const YXIEARPHONE =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780915792/Bitmap_xqjt2k.png";

const HomePage: React.FC = () => {
  return (
    <div className="bg-[#FAFAFA] relative">
      <HeroSection />

      <section className=" px-6 sm:px-[clamp(1rem,11.40vw,200px)]  md:px-10 lg:px-12 xl:px-[5.5%] mt-12 md:mt-20 lg:mt-30">
        <div className="flex flex-col  md:flex-row items-start gap-6 md:gap-4 lg:gap-8 pt-12 md:pt-0 mt-6 md:mt-14 lg:flex">
          <CategoryCard
            to="/headphones"
            label="HEADPHONES"
            image={desktopCatergoryEarphone}
            className="mt-8 md:mt-12"
          />
          <CategoryCard
            to="/speakers"
            label="Speakers"
            image={desktopCatergorySpeaker}
            className="mt-8 md:mt-12"
          />
          <CategoryCard
            to="/earphones"
            label="EARPHONES"
            image={desktopCatergoryEarpod}
            className="mt-8 md:mt-12"
          />
        </div>
      </section>

      {/* =========ZX9 SPEAKER FEATURE */}

      <section className=" px-6 sm-[clamp(1rem,11.40vw,200px)]  md:px-10 lg:px-12 xl:px-[5.5%] mt-24 md:mt-43 lg:mt-40">
        <div className="bg-[#D87D4A] flex flex-col lg:flex-row items-end px-6 md:px-12 lg:px-29.25 pt-14 md:pt-16 lg:pt-0 gap-8 lg:gap-28 lg:justify-between rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full border-2 border-white" />
            <div className="absolute -top-20 -left-20 w-100 h-100 rounded-full border-2 border-white" />
          </div>

          <div>
            <img src={HOMEZXX9} alt="" />
          </div>

          <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 max-w-87.25 pb-14 md:pb-16 lg:pb-24">
            <h2 className="font-bold text-[36px] md:text-[56px] leading-tight tracking-[2px] uppercase text-white">
              ZX9 SPEAKER
            </h2>
            <p className="text-[15px] leading-relaxed text-white/75">
              Upgrade to prenium speakers that are phenomally built to deliver
              truly remarkable sound
            </p>
            <Link to="/speakers ">
              <button className="mt-2 bg-black text-white font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#4C4C4C] transition-colors duration cursor-pointer ">
                See Product
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-[clamp(1rem,11.40vw,200px)]  mt-6 md:mt-8 lg:mt-12">
        <div className="relative rounded-xl overflow-hidden min-h-80 flex items-center">
          <img
            src={ZX7mobile}
            alt=""
            className="absolute insect-0 w-full h-full md:hidden"
          />
          <img
            src={ZX7desktop}
            alt=""
            className="absolute insect-0 w-full h-full hidden md:block"
          />
          <div className="relative z-10 ml-6 md:ml-16 lg:ml-24 flex flex-col gap-8 text-start">
            <h2 className="font-bold text-[28px] tracking-[2px] uppercase text-black">
              ZX7 SPEAKER
            </h2>
            <Link to="/prouduct">
              <button className="font-bold tracking-[2px] uppercase text-black cursor-pointer duration-200 hover:bg-black hover:text-white transition-colors text-[13px] border border-black px-8 py-4">
                See product
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className=" px-6 sm:px-[clamp(1rem,11.40vw,200px)]  mt-6 md:mt-8 lg:mt-12">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-3">
          <div className="rounded-xl overfow-hidden">
            <img src={YXIEARPHONE} alt="" className="h-50 w-full md:h-80" />
          </div>

          <div className="bg-[#F1F1F1] rounded-xl flex items-center h-50 md:h-auto">
            <div className="ml-6 md:ml-10 lg:ml-24 flex flex-col gap-8">
              <h2 className="font-bold tracking-[2px] uppercase text-black cursor-pointer duration-200 hover:bg-black hover:text-white transition-colors text-[13px] border border-black px-8 py-4">
                YXI EARPHONES
              </h2>
              <Link to="/product"></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======MAN===== */}

      <Man />
    </div>
  );
};

export default HomePage;
