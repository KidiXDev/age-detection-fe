import React from "react";
import { FiSettings } from "react-icons/fi";

type ModelInfo = {
  range_margin?: number;
  input_size?: string | number;
};

type TechnicalDetailsProps = {
  timestamp: string | number | Date;
  modelInfo?: ModelInfo;
};

const TechnicalDetails: React.FC<TechnicalDetailsProps> = ({
  timestamp,
  modelInfo,
}) => (
  <div className="mt-6 p-4 bg-slate-800/40 backdrop-blur-sm rounded-lg border border-slate-700/30">
    <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
      <FiSettings className="text-slate-400" />
      Technical Details
    </h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
      <div>
        <div className="font-medium text-slate-300">Timestamp</div>
        <div>{new Date(timestamp).toLocaleTimeString("id-ID")}</div>
      </div>
      <div>
        <div className="font-medium text-slate-300">Range Margin</div>
        <div>±{modelInfo?.range_margin} years</div>
      </div>
      <div>
        <div className="font-medium text-slate-300">Model Input</div>
        <div>{modelInfo?.input_size}</div>
      </div>
    </div>
  </div>
);

export default TechnicalDetails;
