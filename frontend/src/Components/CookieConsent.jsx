import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("horme_cookies_consent");
    if (!consent) setIsVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("horme_cookies_consent", "accepted");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-4xl mx-auto bg-[#050505] border border-[#B6B09F]/20 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
            <p className="text-xs text-[#B6B09F] leading-relaxed">
              We use cookies to enhance your experience and analyze our traffic.
              By clicking "Accept", you consent to our use of cookies in
              accordance with our{" "}
              <a href="/cookie-policy" className="text-[#EAE4D5] underline">
                Cookie Policy
              </a>
              .
            </p>
            <div className="flex gap-4 shrink-0">
              <button
                onClick={() => setIsVisible(false)}
                className="text-[10px] text-[#B6B09F] uppercase font-bold"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="bg-[#EAE4D5] text-black px-6 py-2 rounded text-[10px] uppercase font-bold"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
