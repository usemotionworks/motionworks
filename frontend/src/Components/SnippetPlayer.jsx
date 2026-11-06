import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

const SnippetPlayer = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(new Audio(url));

  useEffect(() => {
    // Update the source if the URL changes
    audioRef.current.src = url;

    const audio = audioRef.current;
    const updateProgress = () =>
      setProgress((audio.currentTime / audio.duration) * 100);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [url]);
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4 bg-[#050505] border border-[#B6B09F]/10 px-4 py-2 rounded-full w-full max-w-[200px]">
      <button
        onClick={togglePlay}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
          isPlaying
            ? "bg-[#EAE4D5] text-[#0a0a0a]"
            : "bg-[#B6B09F]/10 text-[#EAE4D5] hover:bg-[#B6B09F]/20"
        }`}
      >
        {isPlaying ? (
          <FaPause size={12} />
        ) : (
          <FaPlay size={12} className="ml-0.5" />
        )}
      </button>

      <div className="flex-grow h-1 bg-[#B6B09F]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#EAE4D5] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default SnippetPlayer;
