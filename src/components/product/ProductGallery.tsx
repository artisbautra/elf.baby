'use client';

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

interface ProductGalleryProps {
  images: string[];
  title: string;
  isNew?: boolean;
}

export function ProductGallery({ images, title, isNew }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0] || '/placeholder-product.jpg');

  // Ensure we have valid images, fallback to placeholder if empty
  const validImages = images.length > 0 ? images : ['/placeholder-product.jpg'];

  return (
    <div className="flex flex-col gap-6">
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg group">
        {selectedImage.startsWith('http') ? (
          <Image 
            src={selectedImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
            <div className="text-center">
              <div className="text-8xl mb-4">🎁</div>
              <p className="text-sm uppercase tracking-widest">Product Image</p>
            </div>
          </div>
        )}
        
        {isNew && (
          <div className="absolute top-6 left-6">
             <span className="px-4 py-2 bg-festive-red text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-md">
              New Arrival
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={clsx(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300",
                selectedImage === image
                  ? "border-primary-950 shadow-md scale-95"
                  : "border-transparent hover:border-slate-300 hover:scale-105"
              )}
            >
              {image.startsWith('http') ? (
                <Image 
                  src={image}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <span className="text-xl">🎁</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

