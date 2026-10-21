import React from "react";
import { useStore } from "../context/StoreContext";
import { useNavigate } from "react-router-dom";
import type { OrderItem } from "../types";
import "../App.css";
import { IoIosCheckmarkCircle } from "react-icons/io";

const ThankYou: React.FC = () => {
  const { cart, orderData, isThankYouOpen, setIsThankYouOpen, clearCart, cartSaving } =
    useStore();

  const navigate = useNavigate();

  if (!isThankYouOpen || !orderData) {
    return null;
  }

  const { orderSummary, cartItems } = orderData;

  const firstItem: OrderItem | undefined = cartItems[0];

  const remainingCout = cartItems.length - 1;

  const handleClose = async (): Promise<void> => {
    if (cart.length && !await clearCart()) return;
    setIsThankYouOpen(false);
    navigate("/");
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center  justify-center p-6 "
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div role="dialog" aria-modal="true" aria-label="Order confirmation" className="bg-white rounded-2xl w-full max-w-135 p-8 md:p-12 flex flex-col gap-6 animate-[fadeIn_0.4s_ease-in]">
        <IoIosCheckmarkCircle className="text-[64px] text-[#D87D4A]" />
        <div>
          <h2 className="font-bold text-2xl md:text-[32px] leading-tight tracking-[1px] uppercase text-black mb-4 ">
            Thank you <br /> for listening.
          </h2>
          <p className="text-sm text-black/50">
            Your demo order has been saved. No payment is collected and no delivery is arranged.
          </p>
        </div>
        <p className="text-sm font-bold break-all">Reference: {orderData.orderId}</p>
        <div className="w-full flex flex-col md:flex-row rounded-xl overflow-hidden">
          <div className="flex-1 bg-[#F1F1F1] p-6 flex flex-col">
            {firstItem && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 ">
                  <div className="w-12 h-12 bg-white rounded-lg flex-items justify-center">
                    <img
                      src={firstItem.image}
                      alt={firstItem.name}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-black">
                      {firstItem.name.split(" ").slice(0, 2).join(" ")}
                    </p>
                    <p className="font-bold text-xs text-black/50">
                      ₦{firstItem.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className="font-bold text-sm text-black/50">
                  x {firstItem.quantity}
                </span>
              </div>
            )}

            {remainingCout > 0 && (
              <>
                <hr className="border-black/10" />

                <p>
                  and {remainingCout} other item{remainingCout > 1 ? "s" : ""}
                </p>
              </>
            )}
          </div>

          <div className="bg-black text-white p-6 flex flex-col justify-center md:min-w-42.5 rounded-b-xl md:rounded-b-none md:rounded-r-xl">
            <p className="text-sm text-white/50 mb-1 uppercase">Grand total</p>
            <p className="font text-lg md:text-xl">
              ₦{orderSummary.grandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          disabled={cartSaving}
          className="bg-[#D87D4A] text-white font-bold text-[13px] tracking-[1px] uppercase px-8 py-4 hover:bg-[#FBAF85] transition-colors duration-200 cursor-pointer w-full text-center"
        >
          {cartSaving ? "Saving your bag…" : "Back to Home"}
        </button>
      </div>
    </div>
  );
};

export default ThankYou;
