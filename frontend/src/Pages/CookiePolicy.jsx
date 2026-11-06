import React from "react";
const CookiePolicy = () => (
  <div className="max-w-4xl mx-auto py-20 px-6 text-[#B6B09F] leading-relaxed">
    <h1 className="text-4xl font-bold text-[#EAE4D5] mb-8 tracking-tighter">
      Cookie Policy
    </h1>
    <p className="text-sm mb-12 italic text-[#B6B09F]/60">
      Last Updated: April 20, 2026
    </p>

    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-4 uppercase tracking-widest text-[12px]">
          1. Introduction
        </h2>
        <p>
          This Cookie Policy explains how <strong>Motion Works</strong> uses
          cookies and similar technologies to recognize you when you visit our
          website. It explains what these technologies are and why we use them.
        </p>
      </div>

      <div className="bg-[#B6B09F]/5 p-8 rounded-xl border border-[#B6B09F]/10">
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-4 uppercase tracking-widest text-[12px]">
          2. Essential Cookies
        </h2>
        <p>
          These are strictly necessary to provide you with services available
          through our Website. This includes authentication (staying logged into
          the artist dashboard) and security features (preventing CSRF attacks).
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-4 uppercase tracking-widest text-[12px]">
          3. Performance & Analytics
        </h2>
        <p>
          We use performance cookies to understand how users interact with our
          music distribution tools, specifically tracking track upload
          completion rates and release queue efficiency. This data is aggregated
          and does not identify individuals.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#EAE4D5] mb-4 uppercase tracking-widest text-[12px]">
          4. Third-Party Services
        </h2>
        <p>
          Motion Works integrates with <strong>AWS S3</strong> for asset
          storage. These third parties may use cookies to ensure transaction
          security and session persistence during asset delivery.
        </p>
      </div>

      <footer className="pt-12 border-t border-[#B6B09F]/10 mt-20">
        <p className="text-xs">
          If you have questions about our use of cookies, please contact the
          Motion Works legal team.
        </p>
      </footer>
    </section>
  </div>
);

export default CookiePolicy;
