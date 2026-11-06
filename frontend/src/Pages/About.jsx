import { useState } from "react";
import imageOne from "../assets/image1.jpg";
import imageTwo from "../assets/image2.jpg";
import imageThree from "../assets/image3.jpg";
import imageFour from "../assets/image4.jpg";
import imageFive from "../assets/image5.jpg";
import imageSix from "../assets/image6.jpg";
import imageSeven from "../assets/image7.jpg";
import imageEight from "../assets/image8.jpg";
import useSEO from "../hooks/useSEO";

const About = () => {
  const [hoveredImage, setHoveredImage] = useState(null);

  // 8 background images with tighter spacing
  const backgroundImages = [
    {
      id: 1,
      src: imageOne,
      position: "md:left-8 left-2 md:top-16 top-12",
      size: "md:w-56 md:h-56 w-32 h-32",
      rotate: "md:rotate-6 rotate-3",
    },
    {
      id: 2,
      src: imageTwo,
      position: "md:right-12 right-2 md:top-[22%] top-[20%]",
      size: "md:w-72 md:h-72 w-40 h-40",
      rotate: "md:-rotate-12 -rotate-6",
    },
    {
      id: 3,
      src: imageThree,
      position: "md:left-[18%] left-[52%] md:top-[38%] top-[36%]",
      size: "md:w-100 md:h-64 w-36 h-36",
      rotate: "md:rotate-3 rotate-2",
    },
    {
      id: 4,
      src: imageFour,
      position: "md:right-[18%] right-[12%] md:top-[54%] top-[52%]",
      size: "md:w-100 md:h-80 w-48 h-48",
      rotate: "md:rotate-12 rotate-6",
    },
    {
      id: 5,
      src: imageFive,
      position: "md:left-[22%] left-[18%] md:top-[70%] top-[68%]",
      size: "md:w-120 md:h-52 w-28 h-28",
      rotate: "md:-rotate-6 -rotate-3",
    },
    {
      id: 6,
      src: imageSix,
      position: "md:right-[22%] right-[18%] md:bottom-[22%] bottom-[20%]",
      size: "md:w-72 md:h-72 w-40 h-40",
      rotate: "md:rotate-0 rotate-0",
    },
    {
      id: 7,
      src: imageSeven,
      position: "md:left-8 left-2 md:bottom-12 bottom-8",
      size: "md:w-90 md:h-56 w-32 h-32",
      rotate: "md:-rotate-3 -rotate-2",
    },
    {
      id: 8,
      src: imageEight,
      position: "md:right-200 right-2 md:bottom-[38%] bottom-[36%]",
      size: "md:w-100 md:h-48 w-24 h-24",
      rotate: "md:rotate-9 rotate-4",
    },
  ];

  useSEO({
    title: "About Us",
    description:
      "What began as a shared dream among like-minded creatives to leave a lasting mark on the music industry has evolved into one of Nigeria’s premier music and marketing agencies.",
    ogImage: imageOne,
  });

  return (
    <div className="relative min-h-[80vh] w-full overflow-hidden bg-[#0a0a0a]">
      {/* 8 Background images with tighter spacing */}
      {backgroundImages.map((image) => (
        <div
          key={image.id}
          className={`absolute ${image.position} ${image.size} ${image.rotate} bg-cover bg-center transition-all duration-700 ease-in-out
            ${hoveredImage === image.id ? "md:scale-110 scale-105 opacity-90 z-20" : "opacity-20 z-10"}`}
          style={{ backgroundImage: `url(${image.src})` }}
          onMouseEnter={() => setHoveredImage(image.id)}
          onMouseLeave={() => setHoveredImage(null)}
          onTouchStart={() => setHoveredImage(image.id)}
          onTouchEnd={() => setHoveredImage(null)}
        />
      ))}

      {/* Content container without background color */}
      <div className="relative z-30 flex flex-col items-start justify-center min-h-[80vh] px-6 md:px-20 text-left">
        <h1 className="text-[#B6B09F] hover:text-[#EAE4D5] text-5xl py-3 md:text-6xl lg:text-7xl font-bold mb-6 transition duration-300">
          About Us
        </h1>

        <p className="text-[#B6B09F] hover:text-[#EAE4D5] max-w-2xl py-3 text-lg md:text-xl transition duration-300">
          What began as a shared dream among like-minded creatives to leave a
          lasting mark on the music industry has evolved into one of Nigeria’s
          premier music and marketing agencies.{" "}
        </p>

        <p className="text-[#B6B09F] hover:text-[#EAE4D5] max-w-2xl py-3 text-lg md:text-xl transition duration-300">
          Through persistence and passion, we've built strong industry
          relationships that deliver real results — from artist development and
          content creation to full-scale marketing and distribution.
        </p>
        <p className="text-[#B6B09F] hover:text-[#EAE4D5] max-w-2xl py-3 text-lg md:text-xl transition duration-300">
          We’re involved in every stage, from concept to execution, ensuring
          that every project we touch is impactful and unforgettable.
        </p>
      </div>
    </div>
  );
};

export default About;
