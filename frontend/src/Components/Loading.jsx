import { motion } from "framer-motion";
import logo from "../assets/motion.png";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-50">
      <motion.div
        animate={{
          scale: [2, 2.1, 2],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img src={logo} alt="Loading" className="w-20 h-20 md:w-20 md:h-20" />
      </motion.div>
    </div>
  );
};

export default Loading;
