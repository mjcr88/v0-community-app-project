import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, PanInfo, AnimatePresence } from 'motion/react';
import { FiCircle, FiCode, FiFileText, FiLayers, FiLayout } from 'react-icons/fi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShineBorder } from "@/components/library/shine-border";
import { Button } from "@/components/ui/button";
import './carousel.css';

export interface CarouselItem {
  title: string;
  description: string;
  id: number;
  icon: React.ReactElement;
  indexOriginal?: number;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
  onIndexChange?: (index: number, description: string) => void;
  onItemClick?: (index: number) => void;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  { title: 'Text Animations', description: 'Cool text animations.', id: 1, icon: <FiFileText /> },
  { title: 'Animations', description: 'Smooth animations.', id: 2, icon: <FiCircle /> },
  { title: 'Components', description: 'Reusable components.', id: 3, icon: <FiLayers /> },
  { title: 'Backgrounds', description: 'Beautiful backgrounds.', id: 4, icon: <FiLayout /> },
  { title: 'Common UI', description: 'Common UI components.', id: 5, icon: <FiCode /> }
];

const VELOCITY_THRESHOLD = 500;
const OFFSET_THRESHOLD = 30;
const GAP = 16;
const SPRING_OPTIONS = { type: 'spring' as const, stiffness: 300, damping: 30 };

export default function Carousel({
  items = DEFAULT_ITEMS,
  baseWidth = 280,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
  onIndexChange,
  onItemClick
}: CarouselProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = baseWidth - 32;
  const trackItemOffset = itemWidth + GAP;

  // Simple index-based approach without clones
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(0); // -1 for prev, 1 for next

  // Calculate offset to center the current item
  const calculateOffset = useCallback((index: number) => {
    const containerWidth = baseWidth;
    const centerOffset = (containerWidth - itemWidth) / 2;
    return centerOffset - (index * trackItemOffset);
  }, [baseWidth, itemWidth, trackItemOffset]);

  // Notify parent of index change
  useEffect(() => {
    if (onIndexChange) {
      const currentItem = items[currentIndex];
      onIndexChange(currentIndex, currentItem?.description || '');
    }
  }, [currentIndex, onIndexChange, items]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || isHovered || items.length <= 1) return;
    const timer = setInterval(() => {
      goToNext();
    }, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, items.length]);

  // Hover pause
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const container = containerRef.current;
    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);
    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
    };
  }, [pauseOnHover]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex(prev => {
      if (loop) {
        return (prev + 1) % items.length;
      }
      return Math.min(prev + 1, items.length - 1);
    });
  }, [loop, items.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex(prev => {
      if (loop) {
        return (prev - 1 + items.length) % items.length;
      }
      return Math.max(prev - 1, 0);
    });
  }, [loop, items.length]);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const shouldSwipeNext = offset.x < -OFFSET_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD;
    const shouldSwipePrev = offset.x > OFFSET_THRESHOLD || velocity.x > VELOCITY_THRESHOLD;

    if (shouldSwipeNext) {
      goToNext();
    } else if (shouldSwipePrev) {
      goToPrev();
    }
  };

  // Get visible items (current, prev, next for smooth transitions)
  const getVisibleItems = useMemo(() => {
    if (items.length === 0) return [];

    const result = [];
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    const nextIndex = (currentIndex + 1) % items.length;

    if (loop || currentIndex > 0) {
      result.push({ item: items[prevIndex], position: -1, originalIndex: prevIndex });
    }
    result.push({ item: items[currentIndex], position: 0, originalIndex: currentIndex });
    if (loop || currentIndex < items.length - 1) {
      result.push({ item: items[nextIndex], position: 1, originalIndex: nextIndex });
    }

    return result;
  }, [items, currentIndex, loop]);

  return (
    <div
      ref={containerRef}
      className="carousel-container"
      style={{
        width: baseWidth,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          height: itemWidth * 0.8,
        }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'pan-y', // Allow vertical scroll, prevent horizontal
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {getVisibleItems.map(({ item, position, originalIndex }) => {
              const isActive = position === 0;

              return (
                <motion.div
                  key={`${item.id}-${originalIndex}`}
                  className="carousel-item"
                  style={{
                    width: itemWidth,
                    height: itemWidth * 0.8,
                    flexShrink: 0,
                    position: 'absolute',
                    left: '50%',
                    marginLeft: -itemWidth / 2,
                  }}
                  initial={{
                    x: direction * itemWidth,
                    opacity: 0,
                    scale: 0.8
                  }}
                  animate={{
                    x: position * (itemWidth + GAP),
                    opacity: isActive ? 1 : 0.5,
                    scale: isActive ? 1 : 0.85,
                  }}
                  exit={{
                    x: -direction * itemWidth,
                    opacity: 0,
                    scale: 0.8
                  }}
                  transition={SPRING_OPTIONS}
                  onClick={() => {
                    if (isActive && onItemClick) {
                      onItemClick(originalIndex);
                    } else if (position === -1) {
                      goToPrev();
                    } else if (position === 1) {
                      goToNext();
                    }
                  }}
                >
                  {isActive && (
                    <ShineBorder
                      className="pointer-events-none absolute inset-0 z-10"
                      shineColor={["#D97742", "#6B9B47"]}
                      duration={10}
                      borderWidth={2}
                    />
                  )}
                  <div className="carousel-item-header">
                    <span className="carousel-icon-container">{item.icon}</span>
                  </div>
                  <div className="carousel-item-content">
                    <div className="carousel-item-title">{item.title}</div>
                    <p className="carousel-item-description">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Desktop Navigation Arrows */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 z-20">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 bg-background/80 hover:bg-background"
          onClick={goToPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-0 z-20">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-8 w-8 bg-background/80 hover:bg-background"
          onClick={goToNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="carousel-indicators-container">
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`carousel-indicator ${index === currentIndex ? 'active' : 'inactive'}`}
              onClick={() => goToIndex(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
