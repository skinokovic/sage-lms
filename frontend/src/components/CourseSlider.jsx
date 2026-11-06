import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CourseCard from "./CourseCard";

import "swiper/css";
import "swiper/css/navigation";

/**
 * Horizontal course carousel — Popular / Featured / Trending rows on
 * the homepage. Built on Swiper for solid, well-tested touch/swipe
 * support on mobile, with custom-styled prev/next arrows on tablet+.
 *
 * Each CourseCard links to its own course (title and image), so the card is
 * not wrapped in another link: a link around buttons would make the wishlist
 * heart and the cart button open the course page instead of working.
 */
export default function CourseSlider({ title, courses }) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const syncEdges = (swiper) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  if (!courses?.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-heading">{title}</h2>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            ref={prevRef}
            type="button"
            disabled={isBeginning}
            aria-label={`Scroll ${title} left`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-heading transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            ref={nextRef}
            type="button"
            disabled={isEnd}
            aria-label={`Scroll ${title} right`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-heading transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="relative">
        {!isBeginning && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-surface to-transparent" />
        )}
        {!isEnd && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-surface to-transparent" />
        )}

        <Swiper
          modules={[Navigation]}
          slidesPerView="auto"
          slidesPerGroupAuto
          spaceBetween={16}
          breakpoints={{ 640: { spaceBetween: 20 } }}
          watchOverflow
          grabCursor
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          onSwiper={syncEdges}
          onSlideChange={syncEdges}
          onReachBeginning={syncEdges}
          onReachEnd={syncEdges}
          onFromEdge={syncEdges}
          onResize={syncEdges}
          className="pb-2"
        >
          {courses.map((course) => (
            <SwiperSlide key={course.id} className="w-auto!">
              <CourseCard {...course} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
