import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlist';
import { useAuthStore } from '../../store/auth';
import { useToast } from './Toast';
import { favoriteApi } from '../../api';
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
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const wishlisted = isWishlisted(account.id);
  const [bursting, setBursting] = React.useState(false);
  const [pending, setPending] = React.useState(false);

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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || pending) return;

    const wasWishlisted = wishlisted;

    // Optimistic update
    if (wasWishlisted) {
      removeItem(account.id);
      showToast('已取消收藏', 'info');
    } else {
      addItem(account);
      setBursting(true);
      setTimeout(() => setBursting(false), 450);
      showToast('已添加到收藏夹', 'success');
    }

    setPending(true);
    try {
      await favoriteApi.toggle(account.id);
    } catch {
      // Rollback on failure
      if (wasWishlisted) {
        addItem(account);
      } else {
        removeItem(account.id);
      }
      showToast('操作失败，请重试', 'error');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
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
      aria-label={wishlisted ? '取消收藏' : '添加收藏'}
    >
      <Heart
        className={`${iconSizes[size]} transition-all duration-200 ${
          wishlisted ? 'fill-red-400' : ''
        } ${bursting ? 'heart-burst text-red-400' : ''}`}
      />
    </button>
  );
};
