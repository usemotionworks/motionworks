import React from "react";
import { motion } from "framer-motion";
import { FaCheck, FaMusic, FaInfoCircle, FaSignature } from "react-icons/fa";

const steps = [
  { id: 1, title: "General Info", icon: <FaInfoCircle /> },
  { id: 2, title: "Tracks & Audio", icon: <FaMusic /> },
  { id: 3, title: "Review & Sign", icon: <FaSignature /> },
];

const ProgressSidebar = ({ currentStep }) => {
  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between max-w-3xl mx-auto relative">
        {/* BACKGROUND CONNECTING LINE */}
        <div className="absolute top-5 left-0 w-full h-[1px] bg-[#B6B09F]/10 z-0" />

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              {/* ICON CIRCLE */}
              <motion.div
                animate={{
                  backgroundColor:
                    isActive || isCompleted ? "#EAE4D5" : "#0a0a0a",
                  borderColor:
                    isActive || isCompleted
                      ? "#EAE4D5"
                      : "rgba(182, 176, 159, 0.2)",
                  scale: isActive ? 1.1 : 1,
                }}
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm transition-colors duration-300 ${
                  isActive || isCompleted
                    ? "text-[#0a0a0a]"
                    : "text-[#B6B09F]/40"
                }`}
              >
                {isCompleted ? <FaCheck size={12} /> : step.icon}
              </motion.div>

              {/* TEXT LABELS */}
              <div className="text-center">
                <p
                  className={`text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5 transition-colors duration-300 ${
                    isActive ? "text-[#EAE4D5]" : "text-[#B6B09F]/30"
                  }`}
                >
                  Step 0{step.id}
                </p>
                <p
                  className={`text-xs font-medium transition-colors duration-300 ${
                    isActive || isCompleted
                      ? "text-[#EAE4D5]"
                      : "text-[#B6B09F]/30"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSidebar;
