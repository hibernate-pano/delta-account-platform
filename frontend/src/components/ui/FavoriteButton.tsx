import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { favoriteApi } from '../../api';
import { useAuthStore } from '../../store/auth';

interface FavoriteButtonProps {
  accountId: number;
  isFavorited?: boolean;
  onToggle?: (isFav: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ accountId, isFavorited = false, onToggle }) => {
  const [favorited, setFavorited] = useState(isFavorited);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token || loading) return;

    setLoading(true);
    try {
      const res = await favoriteApi.toggle(accountId);
      const newState = res.data.data;
      setFavorited(newState);
      onToggle?.(newState);
    } catch (e) {
      // Silently fail - favorite toggle is not critical
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        favorited
          ? 'text-red-500 bg-red-500/20 hover:bg-red-500/30'
          : 'text-gray-400 bg-dark-lighter hover:text-red-500 hover:bg-red-500/10'
      }`}
    >
      <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
    </button>
  );
};
