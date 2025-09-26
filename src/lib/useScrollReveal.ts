import { useRef, useEffect } from "react";

export function useScrollReveal<T extends HTMLElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  direction?: "up" | "down";
}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const threshold = options?.threshold ?? 0.15;
    const rootMargin = options?.rootMargin ?? "0px";
    const direction = options?.direction ?? "up";

    el.style.opacity = "0";
    el.style.transform = direction === "up"
      ? "translateY(80px) scale(0.92)"
      : "translateY(-80px) scale(0.92)";
    el.style.transition = "opacity 1s cubic-bezier(.22,1.61,.36,1), transform 1s cubic-bezier(.22,1.61,.36,1)";

    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) scale(1)";
        } else {
          el.style.opacity = "0";
          el.style.transform = direction === "up"
            ? "translateY(80px) scale(0.92)"
            : "translateY(-80px) scale(0.92)";
        }
      });
    }, { threshold, rootMargin });

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
