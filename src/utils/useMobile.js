import { useState, useEffect } from "react";

/**
 * useMobile — returns { isMobile, isSmall, width }
 * isMobile : true when viewport ≤ 600px
 * isSmall  : true when viewport ≤ 380px (very small phones)
 */
export default function useMobile() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 600
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    // Use ResizeObserver on body for accuracy (handles keyboard resize too)
    const ro = new ResizeObserver(() => setWidth(window.innerWidth));
    ro.observe(document.body);
    window.addEventListener("resize", handler);
    return () => { ro.disconnect(); window.removeEventListener("resize", handler); };
  }, []);

  return {
    isMobile: width <= 600,
    isSmall:  width <= 380,
    width,
  };
}
