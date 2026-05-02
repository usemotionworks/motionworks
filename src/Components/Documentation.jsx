import React, { useState, useEffect } from "react";
import { client } from "../lib/sanity";
import { Link } from "react-router-dom";
import { FaSearch, FaBookOpen } from "react-icons/fa";
import useSEO from "../hooks/useSEO";

const CATEGORIES = [
  { title: "Getting Started With Motion Works", value: "started" },
  { title: "Uploading and Editing Your Music", value: "uploading" },
  { title: "Your Music in Stores and Services", value: "releases" },
  { title: "Analytics and Reporting", value: "analytics" },
  { title: "Wallet & Payouts", value: "wallet" },
  { title: "Account Settings", value: "account" },
];

const Documentation = () => {
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Documentation",
    description: "Documentation for MotionWorks",
  });

  useEffect(() => {
    const query = `*[_type == "article"]{ title, slug, category }`;
    client
      .fetch(query)
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // 🔍 Filter logic
  const filteredArticles = articles.filter((art) =>
    art.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 📂 Grouping logic
  const getArticlesByCategory = (catValue) => {
    return filteredArticles.filter((art) => art.category === catValue);
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-[#B6B09F]">
        Loading Archive...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-10 text-[#EAE4D5]">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif mb-2">Knowledge Base</h1>
          <p className="text-[#B6B09F] text-sm font-light">
            Search our resources or browse by category.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B6B09F]/40 size-3" />
          <input
            type="text"
            placeholder="Search for an issue..."
            className="w-full bg-[#111] border border-[#B6B09F]/20 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-[#EAE4D5] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 gap-12">
        {CATEGORIES.map((cat) => {
          const catArticles = getArticlesByCategory(cat.value);

          // Only show category if it has articles (or if not searching)
          if (catArticles.length === 0 && searchTerm !== "") return null;

          return (
            <section key={cat.value} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[#B6B09F]/10 pb-2">
                <FaBookOpen className="text-[#EAE4D5] size-3" />
                <h2 className="text-sm font-serif uppercase tracking-[0.2em] text-[#EAE4D5]">
                  {cat.title}
                </h2>
                <span className="text-[10px] text-[#B6B09F]/40 ml-auto">
                  {catArticles.length} Articles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catArticles.length > 0 ? (
                  catArticles.map((article) => (
                    <Link
                      key={article?.slug?.current}
                      to={`/docs/${article?.slug?.current}`}
                      className="group p-5 bg-[#B6B09F]/5 border border-[#B6B09F]/10 rounded-xl hover:bg-[#B6B09F]/10 hover:border-[#EAE4D5]/30 transition-all"
                    >
                      <h3 className="text-sm font-medium group-hover:text-[#EAE4D5] transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[10px] text-[#B6B09F]/40 mt-3 uppercase tracking-widest">
                        Read Article →
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-[10px] text-[#B6B09F]/30 italic py-2">
                    No articles in this section yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredArticles.length === 0 && searchTerm !== "" && (
        <div className="text-center py-20 border border-dashed border-[#B6B09F]/10 rounded-3xl">
          <p className="text-[#B6B09F] text-sm">
            No results found for "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="text-[10px] uppercase text-[#EAE4D5] mt-4 underline underline-offset-4"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default Documentation;
