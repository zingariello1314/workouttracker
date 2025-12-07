/**
 * useSwipeNavigation.test.js
 * 
 * Property-based tests for swipe navigation detection
 * 
 * Tests the correctness properties defined in the design document:
 * - Property 1: Swipe direction validation
 * - Property 2: Threshold enforcement
 * - Property 3: Velocity-based threshold reduction
 * - Property 4: Interactive element exclusion
 * - Property 5: Event listener cleanup
 * - Property 6: Single navigation per swipe
 * 
 * @module hooks/__tests__/useSwipeNavigation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useSwipeNavigation } from '../useSwipeNavigation';

// ==================== PROPERTY-BASED TESTS ====================

describe('useSwipeNavigation - Property-Based Tests', () => {
  
  beforeEach(() => {
    // Setup fake timers for requestAnimationFrame
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  /**
   * **Feature: homepage-swipe-navigation, Property 1: Swipe direction validation**
   * **Validates: Requirements 1.2**
   * 
   * Property: For any swipe gesture, if the vertical distance is greater than 
   * the horizontal distance AND the direction is downward, then the swipe 
   * should be classified as a valid down swipe candidate.
   */
  describe('Property 1: Swipe direction validation', () => {
    it('should classify swipe as down when vertical distance > horizontal distance and moving downward', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary coordinates for swipe gestures
          fc.record({
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 0, max: 500 }),
            // Ensure we move downward (currentY > startY)
            deltaY: fc.integer({ min: 1, max: 500 }),
            // Ensure horizontal movement is less than vertical
            deltaX: fc.integer({ min: -100, max: 100 })
          }).filter(({ deltaY, deltaX }) => {
            // Only test cases where vertical movement > horizontal movement
            return Math.abs(deltaY) > Math.abs(deltaX);
          }),
          (coords) => {
            const { startX, startY, deltaY, deltaX } = coords;
            const currentX = startX + deltaX;
            const currentY = startY + deltaY;
            
            // Create a mock callback
            const onSwipeDown = vi.fn();
            
            // Render the hook
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            // Simulate swipe gesture
            act(() => {
              // Create mock touch start event
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              // Create mock touch move event
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            // Wait for requestAnimationFrame to process
            act(() => {
              vi.runAllTimers();
            });
            
            // Verify the direction is classified as 'down'
            const { swipeState } = result.current;
            
            // Since we filtered for deltaY > 0 and |deltaY| > |deltaX|,
            // the direction should be 'down'
            expect(swipeState.direction).toBe('down');
            
            // Clean up
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
    
    it('should NOT classify swipe as down when horizontal distance >= vertical distance', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 0, max: 500 }),
            deltaY: fc.integer({ min: 1, max: 200 }),
            deltaX: fc.integer({ min: 1, max: 500 })
          }).filter(({ deltaY, deltaX }) => {
            // Only test cases where horizontal movement >= vertical movement
            return Math.abs(deltaX) >= Math.abs(deltaY);
          }),
          (coords) => {
            const { startX, startY, deltaY, deltaX } = coords;
            const currentX = startX + deltaX;
            const currentY = startY + deltaY;
            
            const onSwipeDown = vi.fn();
            
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            act(() => {
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            act(() => {
              vi.runAllTimers();
            });
            
            const { swipeState } = result.current;
            
            // Since horizontal movement >= vertical movement,
            // direction should NOT be 'down' (should be 'none')
            expect(swipeState.direction).not.toBe('down');
            
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should NOT classify swipe as down when moving upward', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 200, max: 700 }),
            // Negative deltaY means moving upward
            deltaY: fc.integer({ min: -500, max: -1 }),
            deltaX: fc.integer({ min: -100, max: 100 })
          }).filter(({ deltaY, deltaX }) => {
            // Ensure vertical movement > horizontal movement
            return Math.abs(deltaY) > Math.abs(deltaX);
          }),
          (coords) => {
            const { startX, startY, deltaY, deltaX } = coords;
            const currentX = startX + deltaX;
            const currentY = startY + deltaY;
            
            const onSwipeDown = vi.fn();
            
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            act(() => {
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            act(() => {
              vi.runAllTimers();
            });
            
            const { swipeState } = result.current;
            
            // Since we're moving upward (deltaY < 0),
            // direction should be 'up', not 'down'
            expect(swipeState.direction).not.toBe('down');
            expect(swipeState.direction).toBe('up');
            
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  /**
   * **Feature: homepage-swipe-navigation, Property 2: Threshold enforcement**
   * **Validates: Requirements 1.3**
   * 
   * Property: For any swipe gesture, if the vertical distance is less than 
   * the threshold AND the velocity is less than the velocity threshold, 
   * then the navigation should NOT be triggered.
   */
  describe('Property 2: Threshold enforcement', () => {
    it('should NOT trigger navigation when distance < threshold and velocity < velocityThreshold', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Generate starting coordinates
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 0, max: 500 }),
            // Generate distance that is LESS than threshold (100px)
            // We'll use distances from 1 to 99 pixels
            distance: fc.integer({ min: 1, max: 99 }),
            // Generate small horizontal movement to ensure vertical dominance
            deltaX: fc.integer({ min: -20, max: 20 }),
            // Generate time that results in velocity < 0.5 px/ms
            // velocity = distance / time, so time = distance / velocity
            // For velocity < 0.5, we need time > distance / 0.5
            // For distance up to 99, we need time > 198ms
            timeElapsed: fc.integer({ min: 200, max: 1000 })
          }).filter(({ distance, deltaX }) => {
            // Ensure vertical movement dominates horizontal
            return distance > Math.abs(deltaX);
          }),
          (params) => {
            const { startX, startY, distance, deltaX, timeElapsed } = params;
            const currentX = startX + deltaX;
            const currentY = startY + distance; // Moving down
            
            // Create a mock callback to track if navigation was triggered
            const onSwipeDown = vi.fn();
            
            // Render the hook with standard threshold (100px) and velocityThreshold (0.5)
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            // Mock Date.now() to control time
            const startTime = 1000;
            vi.spyOn(Date, 'now')
              .mockReturnValueOnce(startTime) // touchstart
              .mockReturnValue(startTime + timeElapsed); // touchmove and after
            
            // Simulate swipe gesture
            act(() => {
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            // Wait for requestAnimationFrame to process
            act(() => {
              vi.runAllTimers();
            });
            
            // Complete the swipe
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
            
            // Verify navigation was NOT triggered
            // Since distance < 100 and velocity < 0.5, navigation should not happen
            expect(onSwipeDown).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design doc
      );
    });
    
    it('should trigger navigation when distance >= threshold even with low velocity', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 0, max: 400 }),
            // Generate distance that is >= threshold (100px)
            distance: fc.integer({ min: 100, max: 300 }),
            deltaX: fc.integer({ min: -20, max: 20 }),
            // Generate time that results in velocity < 0.5 px/ms
            // For distance 100-300, we need time > 200-600ms to get velocity < 0.5
            timeElapsed: fc.integer({ min: 300, max: 1000 })
          }).filter(({ distance, deltaX, timeElapsed }) => {
            // Ensure vertical movement dominates horizontal
            const verticalDominates = distance > Math.abs(deltaX);
            // Ensure velocity is actually < 0.5
            const velocity = distance / timeElapsed;
            return verticalDominates && velocity < 0.5;
          }),
          (params) => {
            const { startX, startY, distance, deltaX, timeElapsed } = params;
            const currentX = startX + deltaX;
            const currentY = startY + distance;
            
            const onSwipeDown = vi.fn();
            
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            const startTime = 1000;
            vi.spyOn(Date, 'now')
              .mockReturnValueOnce(startTime)
              .mockReturnValue(startTime + timeElapsed);
            
            act(() => {
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            act(() => {
              vi.runAllTimers();
            });
            
            // Navigation should be triggered because distance >= threshold
            expect(onSwipeDown).toHaveBeenCalledTimes(1);
            
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should trigger navigation when velocity >= velocityThreshold even with distance < threshold', () => {
      fc.assert(
        fc.property(
          fc.record({
            startX: fc.integer({ min: 0, max: 1000 }),
            startY: fc.integer({ min: 0, max: 500 }),
            // Generate distance that is >= 50px (reduced threshold) but < 100px (normal threshold)
            distance: fc.integer({ min: 50, max: 99 }),
            deltaX: fc.integer({ min: -20, max: 20 }),
            // Generate time that results in velocity >= 0.5 px/ms
            // For velocity >= 0.5, we need time <= distance / 0.5
            // For distance 50-99, we need time <= 100-198ms
            timeElapsed: fc.integer({ min: 10, max: 100 })
          }).filter(({ distance, deltaX, timeElapsed }) => {
            // Ensure vertical movement dominates horizontal
            const verticalDominates = distance > Math.abs(deltaX);
            // Ensure velocity is actually >= 0.5
            const velocity = distance / timeElapsed;
            // Ensure distance is >= reduced threshold (50px) but < normal threshold (100px)
            const inReducedRange = distance >= 50 && distance < 100;
            return verticalDominates && velocity >= 0.5 && inReducedRange;
          }),
          (params) => {
            const { startX, startY, distance, deltaX, timeElapsed } = params;
            const currentX = startX + deltaX;
            const currentY = startY + distance;
            
            const onSwipeDown = vi.fn();
            
            // Mock Date.now() BEFORE rendering the hook
            const startTime = 1000;
            const dateNowSpy = vi.spyOn(Date, 'now')
              .mockReturnValueOnce(startTime)
              .mockReturnValue(startTime + timeElapsed);
            
            const { result } = renderHook(() => 
              useSwipeNavigation({
                threshold: 100,
                velocityThreshold: 0.5,
                enabled: true,
                onSwipeDown
              })
            );
            
            act(() => {
              const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{
                  clientX: startX,
                  clientY: startY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchStartEvent);
            });
            
            act(() => {
              const touchMoveEvent = new TouchEvent('touchmove', {
                touches: [{
                  clientX: currentX,
                  clientY: currentY
                }],
                bubbles: true
              });
              document.dispatchEvent(touchMoveEvent);
            });
            
            act(() => {
              vi.runAllTimers();
            });
            
            // Navigation should be triggered because velocity >= 0.5 reduces threshold to 50px
            expect(onSwipeDown).toHaveBeenCalledTimes(1);
            
            act(() => {
              const touchEndEvent = new TouchEvent('touchend', {
                bubbles: true
              });
              document.dispatchEvent(touchEndEvent);
            });
            
            // Restore the spy
            dateNowSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
