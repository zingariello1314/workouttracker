/**
 * AdaptiveText Component
 * Automatically adjusts font size based on text length and container width
 * Ensures text always fits without truncation or line wrapping
 */

import React, { useState, useEffect, useRef } from 'react';

const AdaptiveText = ({ 
  children, 
  className = '', 
  style = {}, 
  minFontSize = 24, 
  maxFontSize = 80, 
  containerWidth = null,
  ...props 
}) => {
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isCalculating, setIsCalculating] = useState(true);

  // Calculate optimal font size
  const calculateOptimalFontSize = () => {
    if (!textRef.current) return;

    const element = textRef.current;
    const container = element.parentElement;
    
    if (!container) return;

    // Get available width (use containerWidth prop if provided, otherwise container width)
    const availableWidth = containerWidth || container.clientWidth;
    
    if (availableWidth <= 0) return;

    // Start with max font size and reduce until text fits
    let currentFontSize = maxFontSize;
    
    // Create a temporary element to measure text width
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'nowrap';
    tempElement.style.pointerEvents = 'none';
    tempElement.style.top = '-9999px';
    tempElement.style.left = '-9999px';
    
    // Copy computed styles from original element
    const computedStyle = window.getComputedStyle(element);
    tempElement.style.fontFamily = computedStyle.fontFamily;
    tempElement.style.fontWeight = computedStyle.fontWeight;
    tempElement.style.letterSpacing = computedStyle.letterSpacing;
    tempElement.style.textTransform = computedStyle.textTransform;
    
    // Get text content without HTML tags for accurate measurement
    const textContent = element.textContent || element.innerText || '';
    tempElement.textContent = textContent;
    
    document.body.appendChild(tempElement);

    try {
      // Binary search for optimal font size (more efficient)
      let minSize = minFontSize;
      let maxSize = maxFontSize;
      let optimalSize = maxFontSize;
      
      while (maxSize - minSize > 1) {
        currentFontSize = Math.floor((minSize + maxSize) / 2);
        tempElement.style.fontSize = `${currentFontSize}px`;
        
        if (tempElement.scrollWidth <= availableWidth * 0.95) { // 5% margin for safety
          optimalSize = currentFontSize;
          minSize = currentFontSize;
        } else {
          maxSize = currentFontSize;
        }
      }
      
      // Final check with the optimal size
      tempElement.style.fontSize = `${optimalSize}px`;
      if (tempElement.scrollWidth > availableWidth * 0.95) {
        optimalSize = Math.max(optimalSize - 2, minFontSize);
      }
      
      setFontSize(optimalSize);
      setIsCalculating(false);
    } finally {
      document.body.removeChild(tempElement);
    }
  };

  // Recalculate when content or container changes
  useEffect(() => {
    // Only recalculate if content actually changed
    const currentContent = React.Children.toArray(children)
      .map(child => {
        if (typeof child === 'string') return child;
        if (React.isValidElement(child) && child.props.children) {
          return typeof child.props.children === 'string' ? child.props.children : '';
        }
        return '';
      })
      .join('');
    
    if (currentContent.trim() === '') return;
    
    setIsCalculating(true);
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      try {
        calculateOptimalFontSize();
      } catch (error) {
        console.warn('AdaptiveText: Error calculating font size, using fallback', error);
        setFontSize(getResponsiveFontSize());
        setIsCalculating(false);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [children, containerWidth, minFontSize, maxFontSize]);

  // Recalculate on window resize with debounce
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsCalculating(true);
        try {
          calculateOptimalFontSize();
        } catch (error) {
          console.warn('AdaptiveText: Error on resize, using fallback', error);
          setFontSize(getResponsiveFontSize());
          setIsCalculating(false);
        }
      }, 150); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Calculate responsive font size based on text length as fallback
  const getResponsiveFontSize = () => {
    if (!children) return maxFontSize;
    
    // Get total text length
    const textContent = React.Children.toArray(children)
      .map(child => {
        if (typeof child === 'string') return child;
        if (React.isValidElement(child) && child.props.children) {
          return typeof child.props.children === 'string' ? child.props.children : '';
        }
        return '';
      })
      .join('');
    
    const totalLength = textContent.length;
    
    // Calculate font size based on text length
    if (totalLength <= 30) return maxFontSize;
    if (totalLength <= 50) return Math.max(maxFontSize * 0.85, minFontSize);
    if (totalLength <= 80) return Math.max(maxFontSize * 0.7, minFontSize);
    if (totalLength <= 120) return Math.max(maxFontSize * 0.6, minFontSize);
    return Math.max(maxFontSize * 0.5, minFontSize);
  };

  const finalFontSize = isCalculating ? getResponsiveFontSize() : fontSize;

  return (
    <div
      ref={textRef}
      className={className}
      style={{
        ...style,
        fontSize: `${finalFontSize}px`,
        lineHeight: '1.1',
        transition: isCalculating ? 'none' : 'font-size 0.3s ease-out',
        opacity: isCalculating ? 0.8 : 1,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default AdaptiveText;