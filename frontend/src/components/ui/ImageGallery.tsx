import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDelta, setSwipeDelta] = useState(0);
  const imgRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [galleryFocused, setGalleryFocused] = useState(false);

  // Keyboard navigation: ←/→ works in main gallery when hovered/focused, and in lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (inInput) return;

      // Lightbox nav
      if (lightboxOpen) {
        if (e.key === 'Escape') { setLightboxOpen(false); setZoomLevel(1); }
        if (e.key === 'ArrowLeft') navigatePrev();
        if (e.key === 'ArrowRight') navigateNext();
        if (e.key === '+' || e.key === '=') setZoomLevel((z) => Math.min(z + 0.5, 4));
        if (e.key === '-') setZoomLevel((z) => Math.max(z - 0.5, 0.5));
        return;
      }

      // Main gallery: arrow keys when gallery is hovered
      if (galleryFocused && images.length > 1) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentIndex((p) => (p === images.length - 1 ? 0 : p + 1)); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, galleryFocused, images.length, navigatePrev, navigateNext]);

  // Reset zoom on image change
  useEffect(() => {
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  }, [lightboxIndex]);

  const navigatePrev = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const navigateNext = useCallback(() => {
    setLightboxIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    setDragOffset({ x: dx, y: dy });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && zoomLevel <= 1) {
      // Swipe to navigate
      if (dx > 0) navigatePrev();
      else navigateNext();
    }
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-dark rounded-xl flex items-center justify-center border border-dark-border">
        <span className="text-slate-600 text-sm">暂无图片</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div
        ref={galleryRef}
        className="aspect-video bg-dark rounded-xl overflow-hidden cursor-zoom-in relative group"
        onClick={() => openLightbox(currentIndex)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setGalleryFocused(true)}
        onMouseLeave={() => setGalleryFocused(false)}
        role="button"
        aria-label={`点击放大查看图片 ${currentIndex + 1} / ${images.length}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(currentIndex); } }}
      >
        <img
          src={images[currentIndex]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Expand icon */}
        <div className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-white" />
        </div>
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1)); }}
              aria-label="上一张图片"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((p) => (p === images.length - 1 ? 0 : p + 1)); }}
              aria-label="下一张图片"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        {/* Image counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
          {currentIndex + 1} / {images.length}
        </div>
        {/* Progress dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-5 bg-white' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`查看图片 ${idx + 1}，共 ${images.length} 张${idx === currentIndex ? '（当前）' : ''}`}
              aria-current={idx === currentIndex ? 'true' : undefined}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                idx === currentIndex
                  ? 'ring-2 ring-primary opacity-100 scale-105'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setLightboxOpen(false); setZoomLevel(1); }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/60 text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel((z) => Math.max(z - 0.5, 0.5)); }}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                title="缩小 (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/80 text-xs font-mono w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel((z) => Math.min(z + 0.5, 4)); }}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                title="放大 (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); setZoomLevel(1); }}
                aria-label="关闭图片查看"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image area */}
          <div
            ref={imgRef}
            className="flex-1 flex items-center justify-center overflow-hidden relative select-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
          >
            <img
              src={images[lightboxIndex]}
              alt={title}
              className="object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${dragOffset.x / zoomLevel}px, ${dragOffset.y / zoomLevel}px)`,
                maxWidth: '100vw',
                maxHeight: 'calc(100vh - 120px)',
              }}
              draggable={false}
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigatePrev(); }}
                aria-label="上一张图片"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateNext(); }}
                aria-label="下一张图片"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Bottom thumbnails */}
          {images.length > 1 && (
            <div
              className="flex justify-center gap-2 px-4 py-4 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`查看图片 ${idx + 1}，共 ${images.length} 张${idx === lightboxIndex ? '（当前）' : ''}`}
                  aria-current={idx === lightboxIndex ? 'true' : undefined}
                  className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all ${
                    idx === lightboxIndex
                      ? 'ring-2 ring-primary scale-110'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="text-center pb-3 text-white/30 text-xs">
            ← → 导航 · + - 缩放 · Esc 关闭
          </div>
        </div>
      )}
    </div>
  );
};
