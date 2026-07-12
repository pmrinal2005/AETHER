"use client";
import { useEffect, useState } from "react";

// Detects whether the viewport is phone-sized. Used to switch the AIM desktop
// between the draggable-window desktop shell and a stacked mobile shell.
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}
