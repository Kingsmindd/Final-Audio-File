// ============================================================
// pages/NotFoundPage.tsx
// Custom 404 page — shown when a user navigates to an unknown URL.
// Also shown by Vercel instead of their default 404 (via vercel.json config).
// ============================================================

import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Minimal navbar */}
      <div className="bg-black py-6 px-6 sm:px-[clamp(1rem,11.46vw,200px)]">
        <Link to="/">
          <span className="font-bold text-xl tracking-[8px] text-white">
            audiophile
          </span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Large 404 */}
        <h1 className="font-bold text-[120px] md:text-[200px] text-[#F1F1F1] leading-none select-none">
          404
        </h1>

        <div className="-mt-8 md:-mt-12 flex flex-col items-center gap-6">
          <h2 className="font-bold text-[28px] md:text-[40px] tracking-[1.5px] uppercase text-black">
            Page Not Found
          </h2>
          <p className="text-[15px] leading-relaxed text-black/50 max-w-[480px]">
            Oops! Looks like the page you're looking for doesn't exist or has
            been moved. Let's get you back to browsing our premium audio gear.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={() => navigate(-1)}
              className="border border-black bg-[#D87D4A] text-black font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#FBAF85] transition-colors cursor-pointer duration-200 disabled:opacity-60 py-4 disabled:opacity-60"
            >
              Go Back
            </button>
            <Link to="/">
              <button className=" bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase py-4 px-8 hover:bg-[#FBAF85] transition-colors cursor-pointer duration-200 disabled:opacity-60 py-4 disabled:opacity-60">
                Back to Home
              </button>
            </Link>
          </div>
        </div>

        {/* Category shortcuts */}
        <div className="mt-16 flex flex-col sm:flex-row gap-4 items-center">
          <p className="text-sm text-black/50 font-medium">Or browse:</p>
          {[
            { to: "/headphones", label: "Headphones" },
            { to: "/speakers", label: "Speakers" },
            { to: "/earphones", label: "Earphones" },
          ].map((cat) => (
            <Link
              key={cat.to}
              to={cat.to}
              className="text-sm font-bold text-[#D87D4A] hover:text-[#FBAF85] transition-colors uppercase tracking-[1px]"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
