import { useState } from "react";
import FeedbackCard from "./FeedbackCard";
import { FaAmazon } from "react-icons/fa";
import {  SiHbo, SiStarz } from "react-icons/si";
import { TbBrandWix } from "react-icons/tb";

const feedbacks = [
  {
    logo: <FaAmazon className="text-yellow-600 text-2xl" />, company: "Amazon", rating: 4.7, name: "Martin Kazlauskas", username: "sartorial_statue_59", comment: "Fast delivery and great customer support. Highly recommended!"
  },
  {
    logo: <TbBrandWix className="text-blue-700 text-2xl" />, company: "Wix", rating: 4.2, name: "Tawanna Afumba", username: "intransigent_toejam_15", comment: "Easy website builder, lots of templates."
  },
  {
    logo: <SiStarz className="text-pink-500 text-2xl" />, company: "Starz", rating: 4.9, name: "Larry King", username: "pendulous_unicorn_46", comment: "Great movie selection and streaming quality."
  },
  {
    logo: <SiHbo className="text-purple-600 text-2xl" />, company: "HBO", rating: 4.5, name: "Fatima Mohamed", username: "salubrious_artist_72", comment: "Best original series and documentaries."
  },
  {
    logo: <TbBrandWix className="text-orange-500 text-2xl" />, company: "Shopify", rating: 4.8, name: "Nguyen Minh", username: "creative_mind_88", comment: "Easy to manage my online store, great integrations."
  },
  {
    logo: <FaAmazon className="text-green-600 text-2xl" />, company: "Spotify", rating: 4.6, name: "Pham Lan", username: "happy_user_21", comment: "Music streaming is smooth, lots of playlists."
  },
];

export default function FeedbackSection() {
  const [showAll, setShowAll] = useState(false);
  const visibleFeedbacks = showAll ? feedbacks : feedbacks.slice(0, 6);

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Our trusted <span className="text-orange-500 bg-orange-100 px-2 rounded">Clients</span>
        </h2>
        <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
          Our mission is to drive progress and enhance the lives of our customers by delivering superior products and services that exceed expectations.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center">
          {visibleFeedbacks.map((fb) => (
            <FeedbackCard key={fb.name + fb.company} {...fb} />
          ))}
        </div>
        {feedbacks.length > 6 && (
          <div className="text-center mt-8">
            <button
              className="px-5 py-2 rounded bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Ẩn bớt" : "Xem tất cả"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
