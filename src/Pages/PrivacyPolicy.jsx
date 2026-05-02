import React from "react";
import { motion } from "framer-motion";
import useSEO from "../hooks/useSEO";

const PrivacyPolicy = () => {
  const sectionStyle = "mb-10";
  const h3Style =
    "text-[#EAE4D5] font-serif text-lg mb-4 tracking-wide uppercase border-l-2 border-[#B6B09F]/30 pl-4";
  const h4Style =
    "text-[#EAE4D5] text-xs font-bold mb-3 uppercase tracking-widest opacity-90";
  const pStyle = "text-[#B6B09F] text-sm leading-relaxed mb-4 opacity-80";
  const listStyle =
    "list-disc ml-6 text-[#B6B09F] text-sm space-y-2 mb-6 opacity-80";

  useSEO({
    title: "Privacy Policy",
    description: "Privacy Policy for MotionWorks",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-[#050505] p-8 md:p-16 border border-[#B6B09F]/10 rounded-2xl shadow-2xl font-sans"
    >
      {/* HEADER */}
      <header className="border-b border-[#B6B09F]/10 pb-10 mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-[#EAE4D5] mb-4 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#B6B09F]/50">
          Effective Date: 17th April 2026
        </p>
      </header>

      {/* 1. INTRODUCTION */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Introduction</h3>
        <p className={pStyle}>
          MotionWorks (“we”, “us”, “our”) is a music distribution and rights
          management platform based in Nigeria. We provide services that enable
          artists, producers, songwriters, and rights holders to distribute,
          manage, and monetise their musical works.
        </p>
        <p className={pStyle}>
          This Privacy Policy explains how we collect, use, disclose, and
          protect your personal data when you use our website, platform, and
          services (collectively, the “Platform”).
        </p>
        <p className={pStyle}>
          We are committed to protecting your personal data in compliance with
          the Nigerian Data Protection Act, 2023 (NDPA) and other applicable
          laws.
        </p>
      </section>

      {/* 2. WHO WE ARE */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Who We Are</h3>
        <p className={pStyle}>
          MotionWorks acts as a data controller in respect of the personal data
          processed through the Platform.
        </p>
      </section>

      {/* 3. INFORMATION WE COLLECT */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Information We Collect</h3>
        <p className={pStyle}>
          We may collect and process the following categories of personal data:
        </p>

        <h4 className={h4Style}>a. Information You Provide</h4>
        <ul className={listStyle}>
          <li>Full name, Email address, Phone number, and Address</li>
          <li>Bank and payment details (for royalty payments)</li>
          <li>Account login details</li>
          <li>
            Professional information (artist name, label, publishing details)
          </li>
          <li>Content uploads (music files, artwork, metadata)</li>
        </ul>

        <h4 className={h4Style}>b. Automatically Collected Information</h4>
        <ul className={listStyle}>
          <li>IP address, Device information, and Browser type</li>
          <li>Usage data (pages visited, time spent, clicks)</li>
          <li>Cookies and tracking data</li>
        </ul>

        <h4 className={h4Style}>c. Information from Third Parties</h4>
        <ul className={listStyle}>
          <li>Distributors and digital streaming platforms</li>
          <li>Payment processors and Business partners</li>
          <li>Social media platforms (where accounts are linked)</li>
        </ul>
      </section>

      {/* 4. HOW WE USE YOUR INFORMATION */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>How We Use Your Information</h3>
        <p className={pStyle}>We may use your data to:</p>
        <ul className={listStyle}>
          <li>Create and manage your account</li>
          <li>Distribute and monetise your music</li>
          <li>Process royalty payments and provide customer support</li>
          <li>Communicate with you regarding updates and service notices</li>
          <li>Improve our platform, prevent fraud, and ensure security</li>
          <li>Comply with legal and regulatory obligations</li>
        </ul>
      </section>

      {/* 5. HOW WE SHARE YOUR INFORMATION */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>How We Share Your Information</h3>
        <p className={pStyle}>
          We may share your personal data where necessary with:
        </p>
        <ul className={listStyle}>
          <li>
            Digital Service Providers (DSPs) for distribution and tracking
          </li>
          <li>Payment processors and financial institutions</li>
          <li>
            Service providers and technical partners supporting platform
            operations
          </li>
          <li>
            Affiliates involved in rights management or content exploitation
          </li>
          <li>
            Regulatory authorities or law enforcement agencies, where required
            by law
          </li>
          <li>
            Other users, where you choose to make information public (e.g.
            artist profiles)
          </li>
        </ul>
        <p className="text-[#EAE4D5] text-xs font-bold tracking-widest mt-4">
          WE DO NOT SELL YOUR PERSONAL DATA.
        </p>
      </section>

      {/* 6. ARTIST, PRODUCER AND RIGHTS HOLDER DATA */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Artist, Producer and Rights Holder Data</h3>
        <p className={pStyle}>
          Where you use MotionWorks as an artist, producer, songwriter, label,
          or rights holder (“Rights Holder”), we collect:
        </p>
        <ul className={listStyle}>
          <li>Musical works and recordings (audio files, artwork, metadata)</li>
          <li>
            Ownership and split information (publishing, producer shares,
            royalty allocations)
          </li>
          <li>
            Distribution data (platforms, territories, and release schedules)
          </li>
          <li>
            Performance and royalty data from third-party platforms (streams,
            downloads, revenue reports)
          </li>
          <li>Payment and tax information required for royalty disbursement</li>
        </ul>

        <div className="bg-[#B6B09F]/5 border border-[#B6B09F]/20 p-6 rounded-lg my-6">
          <h4 className="text-[#EAE4D5] font-serif mb-3">
            IMPORTANT: CORE BUSINESS CLAUSE
          </h4>
          <p className="text-[#B6B09F] text-xs leading-relaxed">
            We process this information for: administering rights; distributing
            content to DSPs; tracking performance; calculating, allocating, and
            paying royalties; and enforcing rights or resolving disputes
            relating to ownership and revenue.
          </p>
        </div>
      </section>

      {/* 7. DATA ACCURACY */}
      <section className="mb-10 p-6 border-2 border-red-900/20 bg-red-950/5 rounded-lg">
        <h3 className="text-red-500/80 font-serif text-lg mb-2 uppercase tracking-tighter">
          Data Accuracy (Critical)
        </h3>
        <p className="text-[#B6B09F] text-sm italic">
          You are responsible for ensuring that all information provided,
          including ownership splits, credits, and metadata, is accurate and up
          to date. MotionWorks shall not be liable for any loss, misallocation
          of royalties, or disputes arising from incorrect or incomplete
          information provided by you.
        </p>
      </section>

      {/* 8. COLLABORATOR DATA & ROYALTIES */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Collaborator & Royalty Data</h3>
        <p className={pStyle}>
          <strong>Collaborator Data:</strong> You confirm you have obtained
          necessary consent to provide data for co-writers or performers.
        </p>
        <p className={pStyle}>
          <strong>Royalty & Payment:</strong> We use financial data to calculate
          distributions and generate financial reports.
        </p>
      </section>

      {/* 9. RETENTION & SECURITY */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Data Retention & Security</h3>
        <p className={pStyle}>
          We retain data as long as necessary to provide services and comply
          with law. We implement technical measures to protect against loss or
          misuse, though no internet transmission is 100% secure.
        </p>
      </section>

      {/* 10. YOUR RIGHTS */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Your Rights</h3>
        <p className={pStyle}>Under the NDPA 2023, you have the right to:</p>
        <ul className={listStyle}>
          <li>Request access to or correction of your data</li>
          <li>Request deletion (where applicable)</li>
          <li>Restrict or object to processing and request data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      {/* 11. LEGAL MISC */}
      <section className={sectionStyle}>
        <h3 className={h3Style}>Additional Disclosures</h3>
        <p className={pStyle}>
          <strong>Third-Party Links:</strong> We are not responsible for the
          privacy practices of external sites.
        </p>
        <p className={pStyle}>
          <strong>Children’s Privacy:</strong> Our Platform is not intended for
          individuals under 18.
        </p>
        <p className={pStyle}>
          <strong>International Transfers:</strong> Transfers outside Nigeria
          are carried out with adequate legal safeguards.
        </p>
      </section>

      {/* CONTACT */}
      <footer className="mt-16 pt-10 border-t border-[#B6B09F]/10">
        <h3 className={h3Style}>Contact Us</h3>
        <p className={pStyle}>
          If you have any questions about this Privacy Policy or how your data
          is handled, please contact our data compliance team.
        </p>
      </footer>
    </motion.div>
  );
};

export default PrivacyPolicy;
