import { Star } from "lucide-react";
import React from "react";

interface FeedbackCardProps {
  logo: React.ReactNode;
  company: string;
  rating: number;
  name: string;
  username: string;
  comment: string;
  tilt?: boolean;
}

export default function FeedbackCard({ logo, company, rating, name, username, comment, tilt }: FeedbackCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-3 min-w-[260px] max-w-[320px] transition-transform duration-300 ${tilt ? 'rotate-[-3deg]' : ''}`}
      style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.07)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {logo}
          <span className="font-bold text-lg text-gray-800">{company}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-700 text-base">{rating.toFixed(1)}</span>
          <Star className="w-4 h-4 text-green-500 fill-green-500" />
        </div>
      </div>
      <p className="text-gray-700 text-sm mb-2">"{comment}"</p>
      <div className="flex flex-col gap-1 mt-auto">
        <span className="font-semibold text-gray-900 text-sm">{name}</span>
        <span className="text-xs text-gray-400">{username}</span>
      </div>
    </div>
  );
}
