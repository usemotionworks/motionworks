import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroVideo from "../assets/label-showreel.mp4";
import useSEO from "../hooks/useSEO";
import logo from "../assets/motion.png";
import { useUserStore } from "../store/useUserStore";

export default function Homepage() {
  const { user } = useUserStore(); // 👈 Access user state

  useSEO({
    title: "Home",
    description:
      "Distribute your music, find collaborators and get paid - all in one place.",
  });

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 },
  };

  // Helper for dynamic link logic
  const getHeroPath = () => {
    if (!user) return "/signup";
    return user.role === "admin" ? "/admin" : "/dashboard";
  };

  return (
    <div className="bg-[#050505] text-[#B6B09F] selection:bg-[#EAE4D5] selection:text-black">
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 z-0 grayscale"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="relative z-10 text-center px-6">
          <motion.div {...fadeIn} className="flex flex-col items-center">
            <div className="mb-10 md:mb-14">
              <img
                src={logo}
                alt="Motion Works Logo"
                className="h-70 md:h-100 w-auto object-contain brightness-110"
              />
            </div>
            <p className="text-sm md:text-lg max-w-xl -mt-16 mx-auto mb-12 text-[#B6B09F]/80 font-light leading-relaxed tracking-wide">
              Distribute your music, find collaborators and get paid —
              <span className="text-[#EAE4D5] block italic mt-1">
                all in one place.
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={getHeroPath()}
                className="px-10 py-4 bg-[#EAE4D5] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 transition-all"
              >
                {user ? "Go to Dashboard" : "Start Releasing"}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#EAE4D5] to-transparent" />
          <span className="text-[8px] uppercase tracking-[0.4em]">Scroll</span>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION (Replaces Featured/Promo) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <motion.div
          {...fadeIn}
          className="grid grid-cols-1 md:grid-cols-3 gap-16"
        >
          <div className="space-y-6">
            <span className="text-4xl font-serif italic text-[#EAE4D5]">
              01.
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#EAE4D5]">
              Seamless Distribution
            </h3>
            <p className="text-sm leading-relaxed font-light text-[#B6B09F]/60">
              Deliver your masters to Spotify, Apple Music, and TikTok with zero
              friction. We handle the technical delivery so you stay in the
              creative flow.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-4xl font-serif italic text-[#EAE4D5]">
              02.
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#EAE4D5]">
              Verified Collaboration
            </h3>
            <p className="text-sm leading-relaxed font-light text-[#B6B09F]/60">
              Connect with verified artists and producers. Our digital split
              sheets and automated contracts ensure everyone is protected from
              day one.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-4xl font-serif italic text-[#EAE4D5]">
              03.
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#EAE4D5]">
              Automated Royalties
            </h3>
            <p className="text-sm leading-relaxed font-light text-[#B6B09F]/60">
              No more manual accounting. Get paid directly through our secure
              fintech integrations with transparent, real-time revenue tracking.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA / BANNER SECTION */}
      <section className="py-32 border-y border-[#B6B09F]/10 bg-[#080808]">
        <motion.div {...fadeIn} className="text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-serif text-[#EAE4D5]">
            Ready to Create?
          </h2>
          <Link
            to={getHeroPath()}
            className="inline-block px-12 py-5 bg-transparent border border-[#EAE4D5] text-[#EAE4D5] text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-[#EAE4D5] hover:text-black transition-all"
          >
            {user ? "Access Dashboard" : "Apply for Entry"}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
