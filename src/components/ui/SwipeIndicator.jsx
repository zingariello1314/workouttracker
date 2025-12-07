import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/swipe-indicator.css';

/**
 * SwipeIndicator Component
 * 
 * Displays visual feedback during swipe gestures on the HomePage.
 * Shows a downward arrow that animates based on swipe progress.
 * 
 * @component
 * @param {Object} props
 * @param {number} props.progress - Swipe progress from 0 to 1
 * @param {boolean} props.isValid - Whether the swipe will trigger navigation
 * @param {boolean} props.visible - Whether to show the indicator
 */
const SwipeIndicator = ({ progress, isValid, visible }) => {
  if (!visible) {
    return null;
  }

  // Calculate opacity based on progress (0-1)
  const opacity = Math.min(progress, 1);
  
  // Determine color class based on validation state
  const colorClass = isValid ? 'swipe-indicator--valid' : 'swipe-indicator--progress';
  
  // Add pulse animation when threshold is reached
  const pulseClass = isValid ? 'swipe-indicator--pulse' : '';

  return (
    <div 
      className={`swipe-indicator ${colorClass} ${pulseClass}`}
      style={{ opacity }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={isValid ? "Swipe threshold reached, release to navigate to Dashboard" : `Swipe in progress, ${Math.round(progress * 100)} percent complete`}
    >
      <svg
        className="swipe-indicator__arrow"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5L12 19M12 19L5 12M12 19L19 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Progress ring around the arrow */}
      <svg
        className="swipe-indicator__ring"
        width="64"
        height="64"
        viewBox="0 0 64 64"
      >
        <circle
          className="swipe-indicator__ring-bg"
          cx="32"
          cy="32"
          r="28"
          fill="none"
          strokeWidth="2"
        />
        <circle
          className="swipe-indicator__ring-progress"
          cx="32"
          cy="32"
          r="28"
          fill="none"
          strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 28}`}
          strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress)}`}
        />
      </svg>
    </div>
  );
};

SwipeIndicator.propTypes = {
  progress: PropTypes.number.isRequired,
  isValid: PropTypes.bool.isRequired,
  visible: PropTypes.bool.isRequired,
};

export default SwipeIndicator;
