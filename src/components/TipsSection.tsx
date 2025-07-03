import { FiCheckCircle } from "react-icons/fi";
import { HiOutlineLightBulb } from "react-icons/hi";

export default function TipsSection() {
  return (
    <div className="mt-12 bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <HiOutlineLightBulb className="text-xl text-yellow-400" />
        Tips for Best Results
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-emerald-400 mt-0.5" />
          <span>Use a clear and sharp photo</span>
        </div>
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-emerald-400 mt-0.5" />
          <span>Make sure the face is clearly visible</span>
        </div>
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-emerald-400 mt-0.5" />
          <span>Avoid photos that are too dark</span>
        </div>
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-emerald-400 mt-0.5" />
          <span>Frontal photos give the best results</span>
        </div>
      </div>
    </div>
  );
}
