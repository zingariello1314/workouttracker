import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook for detecting swipe gestures on touch and mouse devices
 * 
 * @param {Object} config - Configuration object
 * @param {number} config.threshold - Minimum distance in pixels for a valid swipe (default: 100)
 * @param {number} config.velocityThreshold - Minimum velocity for fast swipe threshold reduction (default: 0.5)
 * @param {boolean} config.enabled - Enable/disable swipe detection (default: true)
 * @param {Function} config.onSwipeDown - Callback function called on valid down swipe
 * @returns {Object} Swipe state and progress information
 */
export function useSwipeNavigation(config = {}) {
  const {
    threshold = 100,
    velocityThreshold = 0.5,
    enabled = true,
    onSwipeDown = () => {}
  } = config;

  // State for swipe tracking
  const [swipeState, setSwipeState] = useState({
    isSwipping: false,
    startY: 0,
    currentY: 0,
    distance: 0,
    velocity: 0,
    direction: 'none'
  });

  // Refs for tracking swipe data
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const currentXRef = useRef(0);
  const startTimeRef = useRef(0);
  const navigationTriggeredRef = useRef(false);
  const rafIdRef = useRef(null);

  /**
   * Calculate distance between two points
   */
  const calculateDistance = useCallback((startY, currentY) => {
    return currentY - startY;
  }, []);

  /**
   * Calculate velocity (pixels per millisecond)
   */
  const calculateVelocity = useCallback((distance, time) => {
    if (time === 0) return 0;
    return Math.abs(distance) / time;
  }, []);

  /**
   * Determine swipe direction based on coordinates
   */
  const calculateDirection = useCallback((startX, startY, currentX, currentY) => {
    const deltaX = Math.abs(currentX - startX);
    const deltaY = currentY - startY;
    const absDeltaY = Math.abs(deltaY);

    // Vertical movement must be greater than horizontal
    if (absDeltaY <= deltaX) {
      return 'none';
    }

    // Determine if it's up or down
    return deltaY > 0 ? 'down' : 'up';
  }, []);

  /**
   * Check if the event target should be ignored
   */
  const shouldIgnoreTarget = useCallback((target) => {
    if (!target) return false;
    
    // Check if target or any parent has data-swipe-ignore attribute
    let element = target;
    while (element && element !== document.body) {
      if (element.hasAttribute && element.hasAttribute('data-swipe-ignore')) {
        return true;
      }
      element = element.parentElement;
    }
    
    return false;
  }, []);

  /**
   * Update swipe state with throttling via requestAnimationFrame
   */
  const updateSwipeState = useCallback(() => {
    const distance = calculateDistance(startYRef.current, currentYRef.current);
    const timeElapsed = Date.now() - startTimeRef.current;
    const velocity = calculateVelocity(distance, timeElapsed);
    const direction = calculateDirection(
      startXRef.current,
      startYRef.current,
      currentXRef.current,
      currentYRef.current
    );

    setSwipeState({
      isSwipping: true,
      startY: startYRef.current,
      currentY: currentYRef.current,
      distance,
      velocity,
      direction
    });

    // Check if swipe is valid and should trigger navigation
    if (direction === 'down' && !navigationTriggeredRef.current) {
      const effectiveThreshold = velocity > velocityThreshold ? threshold * 0.5 : threshold;
      
      if (distance >= effectiveThreshold) {
        navigationTriggeredRef.current = true;
        onSwipeDown();
      }
    }

    rafIdRef.current = null;
  }, [threshold, velocityThreshold, onSwipeDown, calculateDistance, calculateVelocity, calculateDirection]);

  /**
   * Handle start of swipe (touch or mouse)
   */
  const handleStart = useCallback((clientX, clientY, target) => {
    if (!enabled || shouldIgnoreTarget(target)) return;

    startXRef.current = clientX;
    startYRef.current = clientY;
    currentXRef.current = clientX;
    currentYRef.current = clientY;
    startTimeRef.current = Date.now();
    navigationTriggeredRef.current = false;

    setSwipeState({
      isSwipping: true,
      startY: clientY,
      currentY: clientY,
      distance: 0,
      velocity: 0,
      direction: 'none'
    });
  }, [enabled, shouldIgnoreTarget]);

  /**
   * Handle movement during swipe (touch or mouse)
   */
  const handleMove = useCallback((clientX, clientY) => {
    if (!enabled || !swipeState.isSwipping) return;

    currentXRef.current = clientX;
    currentYRef.current = clientY;

    // Throttle updates using requestAnimationFrame (60 FPS max)
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(updateSwipeState);
    }
  }, [enabled, swipeState.isSwipping, updateSwipeState]);

  /**
   * Handle end of swipe (touch or mouse)
   */
  const handleEnd = useCallback(() => {
    if (!enabled) return;

    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Reset state
    setSwipeState({
      isSwipping: false,
      startY: 0,
      currentY: 0,
      distance: 0,
      velocity: 0,
      direction: 'none'
    });

    // Reset refs
    startXRef.current = 0;
    startYRef.current = 0;
    currentXRef.current = 0;
    currentYRef.current = 0;
    startTimeRef.current = 0;
  }, [enabled]);

  /**
   * Touch event handlers
   */
  const handleTouchStart = useCallback((e) => {
    // Only handle single touch
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, e.target);
  }, [handleStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  /**
   * Mouse event handlers
   */
  const handleMouseDown = useCallback((e) => {
    handleStart(e.clientX, e.clientY, e.target);
  }, [handleStart]);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  /**
   * Setup and cleanup event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    const options = { passive: true };

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    // Add mouse event listeners
    document.addEventListener('mousedown', handleMouseDown, options);
    document.addEventListener('mousemove', handleMouseMove, options);
    document.addEventListener('mouseup', handleMouseUp, options);

    // Cleanup function
    return () => {
      // Remove touch event listeners
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      // Remove mouse event listeners
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [
    enabled,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  ]);

  /**
   * Calculate progress (0-1) for visual feedback
   */
  const swipeProgress = swipeState.direction === 'down' 
    ? Math.min(swipeState.distance / threshold, 1)
    : 0;

  /**
   * Check if swipe will be valid
   */
  const effectiveThreshold = swipeState.velocity > velocityThreshold 
    ? threshold * 0.5 
    : threshold;
  const isSwipeValid = swipeState.direction === 'down' && swipeState.distance >= effectiveThreshold * 0.5;

  return {
    swipeState,
    swipeProgress,
    isSwipeValid
  };
}

export default useSwipeNavigation;
