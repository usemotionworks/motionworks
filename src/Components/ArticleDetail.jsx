import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { client } from "../lib/sanity";
import { PortableText } from "@portabletext/react";
import { FaChevronLeft } from "react-icons/fa";
import useSEO from "../hooks/useSEO";

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query for the specific article by slug
    const query = `*[_type == "article" && slug.current == $slug][0]`;

    client
      .fetch(query, { slug })
      .then((data) => {
        setArticle(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Sanity Fetch Error:", err);
        setLoading(false);
      });
  }, [slug]);

  useSEO({
    title: article?.title,
    description: article?.description,
  });

  // Customizing how the text looks (match your dashboard vibe)
  const components = {
    block: {
      h1: ({ children }) => (
        <h1 className="text-3xl font-serif text-[#EAE4D5] mb-6">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-serif text-[#EAE4D5] mt-8 mb-4 border-b border-[#B6B09F]/10 pb-2">
          {children}
        </h2>
      ),
      normal: ({ children }) => (
        <p className="text-[#B6B09F] leading-relaxed mb-4 text-sm">
          {children}
        </p>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="list-disc list-inside mb-4 text-[#B6B09F] space-y-2">
          {children}
        </ul>
      ),
    },
  };

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-[#B6B09F]">
        Decrypting...
      </div>
    );
  if (!article)
    return (
      <div className="p-20 text-center text-[#B6B09F]">Article not found.</div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* NAVIGATION */}
      <Link
        to="/docs"
        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#B6B09F] hover:text-[#EAE4D5] mb-8 transition-colors"
      >
        <FaChevronLeft size={8} /> Back to Docs
      </Link>

      {/* ARTICLE CONTENT */}
      <article className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-10">
          <span className="text-[10px] bg-[#B6B09F]/10 text-[#B6B09F] px-2 py-1 rounded uppercase tracking-tighter">
            {article.category}
          </span>
          <h1 className="text-4xl font-serif text-[#EAE4D5] mt-4">
            {article.title}
          </h1>
        </header>

        <div className="prose prose-invert max-w-none">
          <PortableText value={article.body} components={components} />
        </div>
      </article>

      {/* FOOTER CALL TO ACTION */}
      <div className="mt-20 p-8 border border-[#B6B09F]/10 rounded-2xl bg-[#B6B09F]/5 text-center">
        <p className="text-xs text-[#B6B09F] mb-4 text-pretty font-light">
          Still need assistance with your release?
        </p>
        <Link
          to="/dashboard/tickets"
          className="text-[10px] uppercase tracking-widest bg-[#EAE4D5] text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-all"
        >
          Open a Support Ticket
        </Link>
      </div>
    </div>
  );
};

export default ArticleDetail;
