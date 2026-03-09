import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  accountId: number;
  initialFavorite?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ accountId, initialFavorite = false }) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // In real app, call API
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        isFavorite 
          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
      }`}
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};
