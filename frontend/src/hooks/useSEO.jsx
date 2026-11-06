import { useEffect } from "react";

const useSEO = ({ title, description, ogImage, ogType = "website" }) => {
  useEffect(() => {
    // 1. Update Page Title
    document.title = `${title} | Motion Works`;

    // 2. Helper function to update or create meta tags
    const setMetaTag = (attr, value, content) => {
      let element = document.querySelector(`meta[${attr}="${value}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 3. Standard Description
    setMetaTag("name", "description", description);

    // 4. Open Graph Tags (For WhatsApp/Social Sharing)
    const url = window.location.href;
    setMetaTag("property", "og:title", `${title} | Abeg Fix`);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", ogType);

    if (ogImage) {
      setMetaTag("property", "og:image", ogImage);
    }

    // Optional: Clean up if necessary (though usually not needed for SEO)
  }, [title, description, ogImage, ogType]);
};

export default useSEO;

// useSEO({
//     title: artisan ? `${artisan.firstName} - ${artisan.specialty}` : "Loading Artisan...",
//     description: `Hire ${artisan?.firstName}, a professional ${artisan?.specialty} in ${artisan?.location}. Verified on Abeg Fix.`,
//     ogImage: artisan?.profileImage || "/default-preview.png",
//     ogType: "profile"
//   });
