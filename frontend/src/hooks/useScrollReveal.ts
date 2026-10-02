import { useEffect, useRef, RefObject } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Premium scroll-reveal hook.
 * Adds the class `is-revealed` when the element enters the viewport.
 * Respects prefers-reduced-motion by adding the class immediately.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
): RefObject<T> {
  const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If user prefers reduced motion, reveal immediately without animation
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('is-revealed');
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}

/**
 * Staggered children scroll reveal.
 * Observes the wrapper and stamps `data-stagger-index` on children
 * so CSS can apply staggered delays.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  childSelector = ':scope > *',
  options: ScrollRevealOptions = {}
): RefObject<T> {
  const { threshold = 0.08, rootMargin = '0px 0px -30px 0px', once = true } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const children = Array.from(container.querySelectorAll(childSelector)) as HTMLElement[];
    children.forEach((child, i) => {
      child.classList.add('stagger-child');
      child.style.setProperty('--stagger-i', String(i));
    });

    if (prefersReducedMotion) {
      children.forEach((child) => child.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            children.forEach((child) => child.classList.add('is-revealed'));
            if (once) observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [childSelector, threshold, rootMargin, once]);

  return ref;
}
