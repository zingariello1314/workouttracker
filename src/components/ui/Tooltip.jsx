import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip Component - Shows helpful information on hover
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element that triggers the tooltip
 * @param {string} props.content - Tooltip text content
 * @param {string} props.position - Tooltip position: 'top', 'bottom', 'left', 'right'
 * @param {number} props.delay - Delay before showing tooltip in ms (default: 300)
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipOffset = 8;

        let x, y;
        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - tooltipOffset;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + tooltipOffset;
            break;
          case 'left':
            x = rect.left - tooltipOffset;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + tooltipOffset;
            y = rect.top + rect.height / 2;
            break;
          default:
            x = rect.left + rect.width / 2;
            y = rect.top - tooltipOffset;
        }

        setCoords({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!content) return children;

  const positionClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2'
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`
          }}
        >
          <div
            className={`px-3 py-2 text-sm text-white bg-gray-900 border border-orange-500/30 rounded-lg shadow-lg shadow-orange-500/20 whitespace-nowrap animate-fade-in ${positionClasses[position]}`}
            role="tooltip"
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-gray-900 border-orange-500/30 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' :
                'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Tooltip;
