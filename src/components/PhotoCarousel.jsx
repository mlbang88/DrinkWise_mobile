import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/zoom';
import '../styles/PhotoCarousel.css';

export const PhotoCarousel = ({ photos, onPhotoClick, initialSlide = 0 }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="photo-carousel-container">
      <Swiper
        modules={[Pagination, Navigation, Zoom]}
        pagination={{ 
          clickable: true,
          dynamicBullets: true 
        }}
        navigation={photos.length > 1}
        zoom={true}
        spaceBetween={0}
        slidesPerView={1}
        initialSlide={initialSlide}
        className="photo-carousel"
        onClick={(swiper, event) => {
          // Click sur l'image pour ouvrir lightbox
          if (onPhotoClick && event.target.tagName === 'IMG') {
            onPhotoClick(photos[swiper.activeIndex]);
          }
        }}
      >
        {photos.map((photo, index) => (
          <SwiperSlide key={index}>
            <div className="swiper-zoom-container">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                loading="lazy"
                className="carousel-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Photo counter */}
      {photos.length > 1 && (
        <div className="photo-counter" aria-live="polite">
          {photos.length} photos
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;
