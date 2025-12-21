"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export function TimelineContent({
  as: Component = "div",
  animationNum,
  timelineRef,
  customVariants,
  className,
  children,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    if (!timelineRef?.current || !elementRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    observer.observe(elementRef.current)

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [timelineRef])

  return (
    <Component
      ref={elementRef}
      className={className}
      {...props}
    >
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={customVariants}
        custom={animationNum}
      >
        {children}
      </motion.div>
    </Component>
  )
}

