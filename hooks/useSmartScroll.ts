
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
  const prevDependencyRef = useRef(dependency);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // If the user is near the bottom (within 50px), we consider them NOT manually scrolling away
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserScrolling.current = !atBottom;
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current && !isUserScrolling.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
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
