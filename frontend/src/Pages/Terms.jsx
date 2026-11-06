import React from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import useSEO from "../hooks/useSEO";

const Terms = () => {
  const handlePrint = () => {
    window.print();
  };

  useSEO({
    title: "Terms of Use",
    description: "Terms of Use for MotionWorks",
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#EAE4D5] selection:bg-[#B6B09F] selection:text-[#050505]">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md border-b border-[#B6B09F]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-[#B6B09F] hover:text-[#EAE4D5] transition-colors"
          >
            <FaArrowLeft className="text-xs" /> Back to Dashboard
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#B6B09F] hover:text-[#EAE4D5] transition-colors print:hidden"
          >
            <FaPrint /> Print / Save PDF
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Header Section */}
        <header className="mb-16 border-l-2 border-[#B6B09F] pl-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            TERMS OF USE
          </h1>
          <p className="text-[#B6B09F] font-medium uppercase tracking-[0.2em] text-sm">
            Effective: April 18, 2026
          </p>
        </header>

        {/* Content Section */}
        <div className="space-y-12 text-[#B6B09F] leading-relaxed">
          <section>
            <p className="text-lg text-[#EAE4D5]">
              Welcome to MotionWorks! These Terms of Use (“Terms”) govern your
              access to and use of our website, and all related services
              (collectively, the “Services”), provided by MotionWorks and its
              current and future affiliates, subsidiaries, and related entities
              (“MotionWorks”, “we,” “us,” or “our”).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              1. ACCEPTANCE OF TERMS
            </h2>
            <p>
              By accessing or using our Services, you agree to be bound by these
              Terms and our Privacy Policy. If you do not agree to these Terms,
              you may not access or use the Services. These Terms constitute a
              legally binding agreement between you and MotionWorks.
            </p>
            <div className="mt-6">
              <h3 className="text-[#EAE4D5] font-bold mb-2">
                Transactions & Payment Processing
              </h3>
              <p>
                If you purchase products or services through the Site, you agree
                to provide accurate payment information and authorize us and our
                third-party payment processors to charge applicable fees. Orders
                are subject to acceptance and availability, and we reserve the
                right to refuse or cancel orders, including in cases of pricing
                error or suspected fraud. Unless otherwise stated at the time of
                purchase, all sales are final. Payment transactions are
                processed by third-party providers, and we do not store full
                payment card information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              2. INTELLECTUAL PROPERTY RIGHTS
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-[#EAE4D5] font-bold mb-2">Ownership</h3>
                <p>
                  The Services and their entire contents, features, and
                  functionality (including but not limited to all information,
                  software, text, displays, images, video, and audio, and the
                  design, selection, and arrangement thereof) are owned by
                  MotionWorks, its licensors, or other providers of such
                  material and are protected by United States and international
                  copyright, trademark, patent, trade secret, and other
                  intellectual property or proprietary rights laws.
                </p>
              </div>
              <div>
                <h3 className="text-[#EAE4D5] font-bold mb-2">Trademarks</h3>
                <p>
                  The MotionWorks name, logo, and all related names, logos,
                  product and service names, designs, and slogans are trademarks
                  of MotionWorks. You must not use such marks without our prior
                  written permission.
                </p>
              </div>
              <div>
                <h3 className="text-[#EAE4D5] font-bold mb-2">User Content</h3>
                <p>
                  If the Services allow you to post, link, store, share, and
                  otherwise make available certain information, text, graphics,
                  videos, or other material (“User Content”), you are
                  responsible for the User Content that you post on or through
                  the Service, including its legality, reliability, and
                  appropriateness.
                </p>
                <p className="mt-2">
                  By posting User Content on or through the Service, you grant
                  us a worldwide, non-exclusive, royalty-free, perpetual,
                  irrevocable license to use, reproduce, modify, perform,
                  display, distribute, and otherwise disclose to third parties
                  any such material for any purpose.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              3. USER RESPONSIBILITIES
            </h2>
            <p>
              You agree to use the Services only for lawful purposes and in
              accordance with these Terms. You are responsible for ensuring that
              all persons who access the Services through your internet
              connection are aware of these Terms and comply with them. You are
              responsible for any activity that occurs through your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              4. PROHIBITED ACTIVITIES
            </h2>
            <p>You agree not to use the Services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>
                In any way that violates any applicable federal, state, local,
                or international law or regulation.
              </li>
              <li>
                To engage in any conduct that restricts or inhibits anyone’s use
                or enjoyment of the Services, or which, as determined by us, may
                harm MotionWorks or users of the Services.
              </li>
              <li>
                To impersonate or attempt to impersonate MotionWorks, a
                MotionWorks employee, another user, or any other person or
                entity.
              </li>
              <li>
                To transmit, or procure the sending of, any advertising or
                promotional material, including any “junk mail,” “chain letter,”
                “spam,” or any other similar solicitation.
              </li>
            </ul>
            <div className="mt-4">
              <p className="font-bold text-[#EAE4D5] mb-2">
                Automated Access and Data Collection Prohibited.
              </p>
              <p>
                You may not use any automated means, including robots, spiders,
                scrapers, data mining tools, or similar data gathering or
                extraction methods, to access, collect, copy, or monitor the
                Services, any data or content, or any portion thereof, without
                our express written consent. This prohibition includes, but is
                not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>
                  Using bots, crawlers, spiders, or scrapers to harvest data or
                  content
                </li>
                <li>
                  Employing automated scripts to create user accounts or send
                  messages
                </li>
                <li>
                  Circumventing any technical measures we employ to prevent such
                  automated access
                </li>
                <li>
                  Scraping, data mining, or extracting data for any purpose
                  including competitive analysis
                </li>
                <li>
                  You may not use the Services or any content therein for the
                  purpose of training machine learning or artificial
                  intelligence models, whether for commercial or non-commercial
                  purposes, without our prior written authorization. Any
                  unauthorized use of our content to train AI systems is
                  strictly prohibited and may result in legal action.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              5. DISCLAIMERS OF WARRANTIES
            </h2>
            <p className="text-xs tracking-wider leading-relaxed">
              THE SERVICES AND ALL INFORMATION, CONTENT, MATERIALS, PRODUCTS,
              AND OTHER SERVICES INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU
              THROUGH THE SERVICES ARE PROVIDED ON AN ‘AS IS’ AND ‘AS AVAILABLE’
              BASIS. MOTIONWORKS MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY
              KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE SERVICES, OR
              THE INFORMATION, CONTENT, MATERIALS, PRODUCTS, OR OTHER SERVICES
              INCLUDED ON OR OTHERWISE MADE AVAILABLE TO YOU THROUGH THE
              SERVICES. YOU EXPRESSLY AGREE THAT YOUR USE OF THE SERVICES IS AT
              YOUR SOLE RISK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              6. LIMITATION OF LIABILITY
            </h2>
            <p className="text-xs tracking-wider leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, MOTIONWORKS
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
              REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF
              DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE
              SERVICES; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE
              SERVICES; (C) ANY CONTENT OBTAINED FROM THE SERVICES; OR (D)
              UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR
              CONTENT.
            </p>
            <p className="mt-4">
              IN NO EVENT SHALL MOTIONWORKS’S AGGREGATE LIABILITY FOR ALL CLAIMS
              RELATING TO THE SERVICES EXCEED THE GREATER OF ONE HUNDRED
              THOUSAND NAIRA OR THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS
              FOR THE SERVICES GIVING RISE TO THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              7. INDEMNIFICATION
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless MotionWorks, its
              officers, directors, employees, agents, licensors, and suppliers
              from and against all losses, expenses, damages, and costs,
              including reasonable attorneys’ fees, resulting from any violation
              of these Terms of Use or any activity related to your account
              (including negligent or wrongful conduct) by you or any other
              person accessing the Services using your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              8. GOVERNING LAW AND DISPUTE RESOLUTION
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of the Federal Republic of Nigeria.
            </p>
            <p className="mt-2">
              You and MotionWorks agree that any proceedings to resolve or
              litigate any dispute will be conducted solely on an individual
              basis, and that you will not bring a claim as a plaintiff or a
              class member in a class, consolidated, or representative action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              9. TERMINATION
            </h2>
            <p>
              We may terminate or suspend your account and bar access to the
              Services immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever and without limitation,
              including but not limited to a breach of the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              10. CHANGES TO THESE TERMS
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. We will provide notice of any changes by
              posting the new Terms on this site and updating the “Last Updated”
              date. Your continued use of the Services after any such changes
              constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="pt-8 border-t border-[#B6B09F]/10">
            <h2 className="text-xl font-bold text-[#EAE4D5] mb-4">
              11. MISCELLANEOUS PROVISIONS
            </h2>
            <p>
              If any provision of these Terms is held to be invalid or
              unenforceable by a court, the remaining provisions of these Terms
              will remain in effect. These Terms constitute the entire agreement
              between us regarding our Service and supersede and replace any
              prior agreements we might have had between us regarding the
              Service.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Terms;
