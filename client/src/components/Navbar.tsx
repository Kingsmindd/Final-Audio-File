import React, { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link } from "react-router-dom";
import { LuShoppingCart } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";

const navLogo =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780493019/Frame_3_vcnrmh.png";

const headphoneMobileDropDown =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780497345/headset_vwto3d.png";

const speakermobileDropDown =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780497473/dropdown_speaker_mro4ii.png";

const earphonemobileDropDown =
  "https://res.cloudinary.com/dkvooc6af/image/upload/v1780497552/Group_5_hghnwo.png";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { to: "/", label: "HOME" },
    { to: "/headphones", label: "HEADPHONES" },
    { to: "/speakers", label: "SPEAKERS" },
    { to: "/earphones", label: "EARPHONES" },
  ];

  return (
    <nav className="bg-[#101010]">
      <div className="pt-4 md:pt-6.25 w-full px-6 md:px-10 lg:px-12 xl:px-[5.5%]">
        <div className="flex items-center justify-between pb-8 pt-3 md:pt-0 md:p-6.25">
          <button
            className="lg:hidden text-white text-2xl shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <IoClose /> : <GiHamburgerMenu />}
          </button>

          <Link to="/">
            <img src={navLogo} alt="logo" />
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[16px] font-bold text-white tracking-2px hover:text-[#D87D4A] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <button className="relative text-white hover:text-[#D87D4A] transition-colors flex items-center gap-2">
              <LuShoppingCart className="text-[22px]" />
              <span className="text-[16px] font-bold text-white tracking-[1px] hover:text-[#D87D4A] transition-colors uppercase hidden md:inline-block">
                CART
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/login"
                className="text-[16px] font-bold text-white tracking-[1px] hover:text-[#D87D4A] transition-colors uppercase lg:py-2.5 lg:px-5 border border-[#FFFFFF]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-[16px] font-bold text-white tracking-[1px] hover:text-[#FBAF85] transition-colors uppercase lg:py-2.5 lg:px-5 bg-[#D87D4A]"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {isMenuOpen && (
          <div
            className=" py-8 px-0 absolute top-22 left-0 right-0 bg-white rounded-b-xl shadow-2xl z-50 animate-[slideDown_0.3s_ease-out]" // ✅ Fix 2: added "flex gap-4 px-4", removed broken animate class
          >
            <div className="px-6 md:px-10 lg:px-12 xl:px-[5.5%]">
              <div className="flex flex-col md:flex-row gap-14 pt-10">
                {[
                  {
                    to: "/headphones",
                    label: "HEADPHONES",
                    img: headphoneMobileDropDown,
                  },
                  {
                    to: "/speakers",
                    label: "SPEAKERS",
                    img: speakermobileDropDown,
                  },
                  {
                    to: "/earphones",
                    label: "EARPHONES",
                    img: earphonemobileDropDown,
                  },
                ].map((cat) => (
                  <Link
                    key={cat.to}
                    to={cat.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 bg-[#F1F1F1] rounded-lg relative h-41.25 pt-22.5 pb-5 group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex justify-center">
                      <img src={cat.img} alt={cat.label} />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <h4 className="text-[15px] font-bold tracking-[1px] text-black">
                        {cat.label}
                      </h4>

                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-black/50 group-hover:text-[#DB7D4A] uppercase">
                          Shop
                        </span>
                        <FaChevronRight className="text-black/50 group-hover:text-[#DB7D4A]" />{" "}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex gap-4">
                  <Link
                    to="/login"
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="flex-1 text-center py-3 border-2 border-black font-bold text-[13px] uppercase tracking-[1px]"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="flex-1 text-center py-3 border-2 border-black font-bold text-[13px] uppercase tracking-[1px]"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
