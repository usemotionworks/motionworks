import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../lib/axios";
import logo from "../assets/motion.png";
import useSEO from "../hooks/useSEO";
import { PLATFORM_CONFIG } from "../lib/platformConfig";

export default function SmartlinkPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSmartlink = async () => {
      try {
        const res = await axios.get(`/api/lookup/${slug}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartlink();
  }, [slug]);

  useSEO({
    title: data?.title,
    description: `Smartlink for ${data?.title}`,
    ogImage: data?.coverArt,
  });

  const handlePlatformClick = async (platform, url) => {
    try {
      const response = await axios.post("/api/lookup/track-click", {
        smartlinkId: data._id,
        platform,
        targetUrl: url,
        referrer: document.referrer || "direct",
      });

      window.location.href = response.data.redirect;
    } catch (err) {
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#B6B09F]">
        Loading smartlink...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-400">
        Smartlink not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#B6B09F] px-6 py-10">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-4">
          <img src={logo} className="h-12 opacity-90" />

          <p className="text-xs uppercase tracking-[0.3em] text-[#B6B09F]/60">
            Official Smartlink
          </p>
        </div>

        {/* Cover */}
        <div className="flex flex-col items-center gap-4">
          <img
            src={data?.coverArt}
            className="w-48 h-48 rounded-xl shadow-lg object-cover"
          />

          <h1 className="text-xl font-bold text-center text-[#EAE4D5]">
            {data?.title}
          </h1>

          <p className="text-sm text-center text-[#B6B09F]/70">
            {data?.artistName}
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {data?.links &&
            Object.entries(data.links).map(([platform, url]) => {
              const config = PLATFORM_CONFIG[platform];

              return (
                <a
                  key={platform}
                  onClick={() => handlePlatformClick(platform, url)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 w-full px-5 py-4 border border-[#B6B09F]/10 rounded-xl hover:border-[#B6B09F]/40 hover:bg-[#080808] transition-all"
                >
                  {/* Logo */}
                  {config?.icon && (
                    <img
                      src={config.icon}
                      alt={config.label}
                      className="w-6 h-6 object-contain shrink-0"
                    />
                  )}

                  {/* Platform Label */}
                  <span className="text-sm uppercase tracking-[0.2em] text-[#EAE4D5]">
                    {config?.label || platform}
                  </span>
                </a>
              );
            })}
        </div>
      </div>
    </div>
  );
}
