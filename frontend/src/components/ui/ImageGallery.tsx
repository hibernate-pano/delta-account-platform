import React, { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video bg-dark rounded-xl flex items-center justify-center">
        <span className="text-slate-600">暂无图片</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main Image */}
      <div
        className="aspect-video bg-dark rounded-xl overflow-hidden cursor-zoom-in relative group"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <img
          src={images[currentIndex]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              ›
            </button>
          </>
        )}
        {/* Image counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                idx === currentIndex
                  ? 'ring-2 ring-primary opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 text-white text-4xl hover:text-gray-300 transition-colors"
          >
            ×
          </button>
          <img
            src={images[currentIndex]}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
