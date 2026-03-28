import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  score: number; // 0-100 scale
  size?: 'xs' | 'sm' | 'md';
  showScore?: boolean;
  scoreText?: string; // custom score label, e.g. "4.8分"
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  score,
  size = 'sm',
  showScore = false,
  scoreText,
  className = '',
}) => {
  const filledStars = Math.round(score / 20); // convert 0-100 to 0-5 stars

  const sizeClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClasses[size]} transition-all duration-150 hover:scale-125 focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1 focus-visible:ring-offset-dark ${
            s <= filledStars
              ? 'text-yellow-400 fill-yellow-400 hover:drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]'
              : 'text-slate-600 hover:text-slate-400'
          }`}
        />
      ))}
      {showScore && (
        <span className={`ml-0.5 text-yellow-400 ${size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {scoreText ?? `${score}分`}
        </span>
      )}
    </div>
  );
};
