import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlist';
import { Account } from '../../types';

interface WishlistButtonProps {
  account: Account;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  account,
  size = 'md',
  className = '',
}) => {
  const { addItem, removeItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(account.id);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlisted) {
      removeItem(account.id);
    } else {
      addItem(account);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        transition-all duration-200
        ${wishlisted
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-black/40 hover:bg-black/60 text-white/70 hover:text-white'
        }
        ${className}
      `}
      title={wishlisted ? '取消收藏' : '添加收藏'}
    >
      <Heart
        className={`${iconSizes[size]} transition-all duration-200 ${
          wishlisted ? 'fill-red-400 scale-110' : 'scale-100'
        }`}
      />
    </button>
  );
};
