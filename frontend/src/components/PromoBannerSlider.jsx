import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import api from '../api/axios';

const THEMES = [
  {
    bg: 'from-indigo-600 via-blue-600 to-sky-500',
    glow: 'bg-white/15',
    badge: 'bg-amber-400 text-amber-950',
    btn: 'bg-white text-indigo-700 hover:bg-indigo-50',
    accent: 'text-indigo-100',
  },
  {
    bg: 'from-rose-600 via-pink-600 to-orange-400',
    glow: 'bg-white/15',
    badge: 'bg-white text-rose-700',
    btn: 'bg-white text-rose-700 hover:bg-rose-50',
    accent: 'text-rose-100',
  },
  {
    bg: 'from-emerald-600 via-teal-600 to-cyan-500',
    glow: 'bg-white/15',
    badge: 'bg-lime-300 text-emerald-900',
    btn: 'bg-white text-emerald-700 hover:bg-emerald-50',
    accent: 'text-emerald-100',
  },
  {
    bg: 'from-violet-700 via-purple-600 to-fuchsia-500',
    glow: 'bg-white/15',
    badge: 'bg-yellow-300 text-violet-900',
    btn: 'bg-white text-violet-700 hover:bg-violet-50',
    accent: 'text-violet-100',
  },
  {
    bg: 'from-slate-800 via-slate-700 to-blue-800',
    glow: 'bg-white/10',
    badge: 'bg-orange-400 text-slate-900',
    btn: 'bg-orange-400 text-slate-900 hover:bg-orange-300',
    accent: 'text-slate-200',
  },
];

const BadgeIcon = ({ index }) => {
  const icons = [Zap, Tag, Sparkles];
  const Icon = icons[index % icons.length];
  return <Icon className="w-3 h-3" />;
};

const AdSlide = ({ banner, index }) => {
  const theme = THEMES[(banner.theme ?? index) % THEMES.length];
  const image = banner.imagePath || banner.bannerImage || banner.image;
  const href = banner.targetUrl || '/';
  const badge = banner.badge || banner.buttonText || 'AD';
  const isExternal = typeof href === 'string' && href.startsWith('http');

  const content = (
    <div
      className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br ${theme.bg} shadow-lg shadow-black/10`}
    >
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full ${theme.glow} blur-2xl`} />
      <div className={`absolute -bottom-16 -left-8 w-56 h-56 rounded-full ${theme.glow} blur-3xl`} />
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,white_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 h-full flex items-center">
        <div className="flex-1 min-w-0 pl-5 sm:pl-8 md:pl-10 pr-2 py-4 flex flex-col justify-center gap-2 sm:gap-3">
          <span
            className={`inline-flex items-center gap-1.5 self-start text-[10px] sm:text-xs font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-sm ${theme.badge}`}
          >
            <BadgeIcon index={index} />
            {badge}
          </span>

          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm line-clamp-2">
              {banner.title || 'Special Offer'}
            </h2>
            {banner.subtitle && (
              <p
                className={`mt-1 sm:mt-1.5 text-xs sm:text-sm md:text-base font-medium line-clamp-2 max-w-md ${theme.accent}`}
              >
                {banner.subtitle}
              </p>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 self-start mt-1 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md transition-all group-hover:gap-2.5 ${theme.btn}`}
          >
            {banner.buttonText || 'Shop Now'}
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
        </div>

        <div className="relative w-[42%] sm:w-[40%] md:w-[38%] h-full flex items-center justify-center pr-3 sm:pr-6 md:pr-8 shrink-0">
          <div className="absolute w-[85%] aspect-square rounded-full bg-white/10" />
          <div className="absolute w-[70%] aspect-square rounded-full bg-white/10" />
          {image ? (
            <img
              src={image}
              alt={banner.title || 'Promo'}
              className="relative z-10 w-[88%] max-h-[85%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/20 flex items-center justify-center">
              <Tag className="w-10 h-10 text-white/80" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block group h-full">
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className="block group h-full">
      {content}
    </Link>
  );
};

const PromoBannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await api.get('/banners/active');
        setBanners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch banners', error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto mb-2">
        <div className="h-48 sm:h-56 md:h-64 rounded-2xl md:rounded-3xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      </div>
    );
  }

  // No vendor banners → hide slider completely (no fake ads)
  if (!banners.length) {
    return null;
  }

  const canLoop = banners.length > 1;

  return (
    <div className="w-full max-w-[1200px] mx-auto mb-2 promo-banner-slider relative group/slider">
      {canLoop && (
        <>
          <button
            type="button"
            className="promo-banner-prev absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-md border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 transition opacity-0 group-hover/slider:opacity-100 max-sm:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="promo-banner-next absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-md border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-white hover:scale-105 transition opacity-0 group-hover/slider:opacity-100 max-sm:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        slidesPerView={1}
        spaceBetween={0}
        speed={700}
        loop={canLoop}
        loopAdditionalSlides={canLoop ? 2 : 0}
        autoplay={
          canLoop
            ? {
                delay: 3200,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
                stopOnLastSlide: false,
                waitForTransition: true,
              }
            : false
        }
        pagination={canLoop ? { clickable: true } : false}
        navigation={
          canLoop
            ? {
                prevEl: '.promo-banner-prev',
                nextEl: '.promo-banner-next',
              }
            : false
        }
        className={canLoop ? '!pb-8' : ''}
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner._id || `banner-${index}`}>
            <AdSlide banner={banner} index={index} />
          </SwiperSlide>
        ))}
      </Swiper>

      {canLoop && (
        <style>{`
          .promo-banner-slider .swiper-pagination {
            bottom: 0 !important;
          }
          .promo-banner-slider .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            background: #cbd5e1;
            opacity: 1;
            transition: all 0.25s ease;
          }
          .promo-banner-slider .swiper-pagination-bullet-active {
            width: 22px;
            border-radius: 999px;
            background: linear-gradient(90deg, #2563eb, #4f46e5);
          }
        `}</style>
      )}
    </div>
  );
};

export default PromoBannerSlider;
