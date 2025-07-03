import React from "react";
import { IoMaleOutline, IoFemaleOutline } from "react-icons/io5";

type GenderDetailsProps = {
  gender?: "male" | "female" | null;
};

const GenderDetails: React.FC<GenderDetailsProps> = ({ gender }) => {
  if (!gender) return null;

  return (
    <div className="bg-gradient-to-br from-purple-800/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-purple-600/30 lg:col-span-2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 rounded-xl bg-purple-500/20 border border-purple-400/30 flex-shrink-0">
            {gender === "male" ? (
              <IoMaleOutline className="text-2xl sm:text-3xl text-purple-300" />
            ) : (
              <IoFemaleOutline className="text-2xl sm:text-3xl text-purple-300" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs sm:text-sm font-medium text-purple-200 mb-1">
              Detected Gender
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white capitalize">
              {gender === "male" ? "Male" : "Female"}
            </div>
            <div className="text-xs sm:text-sm text-purple-300/70 mt-1">
              Based on facial feature analysis
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/30 flex items-center justify-center">
              {gender === "male" ? (
                <IoMaleOutline className="text-lg lg:text-2xl text-purple-300" />
              ) : (
                <IoFemaleOutline className="text-lg lg:text-2xl text-purple-300" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenderDetails;
