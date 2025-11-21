
import { useRef, useEffect, RefObject } from 'react';

interface UseSmartScrollProps {
  dependency: any;
  enabled?: boolean;
}

interface UseSmartScrollResult {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  scrollToBottom: () => void;
}

export const useSmartScroll = ({ dependency, enabled = true }: UseSmartScrollProps): UseSmartScrollResult => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const ignoreScrollRef = useRef(false); // Flag to ignore scroll events caused by auto-scrolling
  const prevDependencyRef = useRef(dependency);

  const handleScroll = () => {
    // If the scroll event was triggered by scrollToBottom, ignore it
    if (ignoreScrollRef.current) {
        ignoreScrollRef.current = false;
        return;
    }

    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Increased threshold to 150px for robustness against layout shifts (e.g. images loading)
      // Using Math.ceil/abs to handle sub-pixel rendering issues
      const distanceToBottom = Math.abs(scrollHeight - clientHeight - scrollTop);
      const atBottom = distanceToBottom < 150;
      
      isUserScrolling.current = !atBottom;
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current && !isUserScrolling.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      
      // Set flag to ignore the immediate scroll event triggered by this action
      ignoreScrollRef.current = true;
      
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
      
      // Safety cleanup for flag in case smooth scroll takes time
      setTimeout(() => {
          ignoreScrollRef.current = false;
      }, 1000);
    }
  };

  // Effect to scroll when dependency changes (e.g., new messages)
  useEffect(() => {
    if (enabled) {
      // Check if dependency actually changed size (array length) or value
      const hasChanged = Array.isArray(dependency) 
        ? dependency.length > (Array.isArray(prevDependencyRef.current) ? prevDependencyRef.current.length : 0)
        : dependency !== prevDependencyRef.current;

      if (hasChanged) {
         scrollToBottom();
      }
      prevDependencyRef.current = dependency;
    }
  }, [dependency, enabled]);

  return {
    scrollContainerRef,
    handleScroll,
    scrollToBottom
  };
};
