import Lenis from '@studio-freight/lenis';
import CircleType from 'circletype';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

// ===== Constants =====
const CONSTANTS = {
  MIN_TEXT_LENGTH: 28,
  BASE_ROTATION_SPEED: 0.1,
  MAX_ROTATION_SPEED: 0.3,
  LOGO_ANIMATION_SCROLL_END: '200 top',
  RESIZE_DEBOUNCE_TIME: 200,
  LETTER_ANIMATION_DURATION: 1.2,
  LETTER_ANIMATION_STAGGER: 0.08,
  LETTER_ANIMATION_DELAY: 0.15,
  HYPHEN_ANIMATION_DURATION: 0.7,
  ROTATE_SPEED_SMOOTHING: 0.03,
  VELOCITY_SMOOTHING: 0.1,
  VELOCITY_SCALING_FACTOR: 0.5,
  LOGO_ANIMATION_DURATION: 0.5,
  LOGO_ANIMATION_SCALE: 1.1,
  LOGO_ANIMATION_X_OFFSET: 2,
  LOGO_ANIMATION_OPACITY: 0,
  LOGO_ANIMATION_X_MOVE: -20,
  SCROLL_TRIGGER_START: 'top top',
  SCROLL_TRIGGER_SCRUB: 0.3,
  MAX_SCROLL_PROGRESS: 200,
  MARQUEE_ANIMATION_DURATION: 60,
  MARQUEE_INTERSECTION_THRESHOLD: 0.5,
  SVG_FLIP_INTENSITY: 0.2,
  SVG_FLIP_SMOOTHNESS: 0.05,
  LIST_ANIMATION_START: "top 80%",
  LIST_ANIMATION_END: "bottom 20%",
  LIST_ANIMATION_DURATION: 0.8,
  LIST_ANIMATION_STAGGER: 0.2,
};

// ===== Configuration =====
const CONFIG = {
  lenis: {
    duration: 1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical' as const,
    gestureDirection: 'vertical' as const,
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  },
  rotateElements: {
    minTextLength: CONSTANTS.MIN_TEXT_LENGTH,
    baseSpeed: CONSTANTS.BASE_ROTATION_SPEED,
    maxSpeed: CONSTANTS.MAX_ROTATION_SPEED,
  },
};

// ===== GSAP Setup =====
gsap.registerPlugin(ScrollTrigger);

// ===== Custom Error Types =====
class InitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitializationError';
  }
}

class AnimationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnimationError';
  }
}

// ===== Utility Functions =====
const rafCallback = (callback: (event: Event) => void) => {
  let ticking = false;
  return (event: Event) => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback(event);
        ticking = false;
      });
      ticking = true;
    }
  };
};

const isInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
};

const debounce = <F extends (...args: any[]) => any>(func: F, wait: number, immediate: boolean = false) => {
  let timeout: number | null;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    if (timeout !== null) clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// ===== Logger Setup =====
interface LogEntry {
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
}

const logger = {
  logs: [] as LogEntry[],
  log: (level: 'error' | 'warn' | 'info', message: string, error?: Error) => {
    console[level](`${level.toUpperCase()}: ${message}`, error);
    logger.logs.push({ level, message, error });
  },
  error: (message: string, error: Error) => logger.log('error', message, error),
  warn: (message: string) => logger.log('warn', message),
  info: (message: string) => logger.log('info', message),
};

// ===== Lenis Smooth Scrolling Setup =====
const initLenis = (): Lenis => {
  try {
    const lenis = new Lenis(CONFIG.lenis);
    gsap.ticker.add((time: number) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  } catch (error) {
    throw new InitializationError('Failed to initialize Lenis');
  }
};

// ===== Shared RAF Loop =====
let rafActive = false;
const scrollHandlers: ((lenis: Lenis) => void)[] = [];

const sharedRAF = (lenis: Lenis) => {
  if (!rafActive || !lenis) return;
  try {
    lenis.raf(performance.now());
    scrollHandlers.forEach(handler => handler(lenis));
  } catch (error) {
    logger.error('Error in RAF loop', error as Error);
    stopRAF();
  }
  requestAnimationFrame(() => sharedRAF(lenis));
};

const startRAF = (lenis: Lenis) => {
  rafActive = true;
  requestAnimationFrame(() => sharedRAF(lenis));
};

const stopRAF = () => {
  rafActive = false;
};

// ===== Animation Functions =====

// 1. Hero Animation
const initHeroAnimation = () => {
  const svg = document.querySelector('#hero-svg') as SVGElement | null;
  if (!svg) {
    throw new AnimationError('SVG element not found');
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onStart: () => svg.classList.remove('hidden'),
  });

  const letterPairs = ['#F1, #Y2', '#I1, #T2', '#F2, #F4', '#T1, #I2', '#Y1, #F3'];

  tl.set('.letter', { y: 120, opacity: 0, rotation: -5 });

  letterPairs.forEach((pair, index) => {
    tl.to(pair, {
      y: 0,
      opacity: 1,
      rotation: 0,
      duration: CONSTANTS.LETTER_ANIMATION_DURATION,
      stagger: CONSTANTS.LETTER_ANIMATION_STAGGER,
    }, index * CONSTANTS.LETTER_ANIMATION_DELAY);
  });

  tl.from('#hyphen', {
    scaleX: 0,
    transformOrigin: 'center',
    duration: CONSTANTS.HYPHEN_ANIMATION_DURATION,
    ease: 'elastic.out(1, 0.5)'
  }, '-=0.5');
};

// 2. Rotate Elements Animation
type RotateElement = HTMLElement & { circleInstance?: CircleType };

const initializeRotateElements = () => {
  const rotateElements = document.querySelectorAll<RotateElement>('[data-element="circletype"]');

  rotateElements.forEach((element, index) => {
    try {
      setupRotateElement(element, index);
    } catch (error) {
      logger.error(`Error in rotate element initialization for element ${index}`, error as Error);
    }
  });
};

const setupRotateElement = (element: RotateElement, index: number) => {
  const originalText = element.textContent?.trim() || '';
  const repeatedText = repeatTextToMinLength(originalText, CONFIG.rotateElements.minTextLength);
  element.textContent = repeatedText;

  const circleInstance = new CircleType(element);
  element.circleInstance = circleInstance;

  let currentRotation = 0;
  let currentSpeed = CONFIG.rotateElements.baseSpeed;
  let targetSpeed = CONFIG.rotateElements.baseSpeed;
  let smoothedVelocity = 0;
  let direction = 1;

  const updateRotation = () => {
    currentSpeed += (targetSpeed - currentSpeed) * CONSTANTS.ROTATE_SPEED_SMOOTHING;
    currentSpeed = Math.max(CONFIG.rotateElements.baseSpeed, currentSpeed);
    currentRotation += currentSpeed * direction;
    gsap.set(element, { rotation: currentRotation });

    if (!element.classList.contains('visible')) {
      element.classList.add('visible');
    }
  };

  const handleScroll = (velocity: number) => {
    smoothedVelocity += (velocity - smoothedVelocity) * CONSTANTS.VELOCITY_SMOOTHING;
    direction = Math.sign(smoothedVelocity) || 1;
    const scaledVelocity = Math.pow(Math.abs(smoothedVelocity), CONSTANTS.VELOCITY_SCALING_FACTOR);
    targetSpeed = CONFIG.rotateElements.baseSpeed + scaledVelocity * (CONFIG.rotateElements.maxSpeed - CONFIG.rotateElements.baseSpeed);
  };

  scrollHandlers.push((lenis: Lenis) => {
    handleScroll(lenis.velocity);
    updateRotation();
  });

  setAccessibilityAttributes(element, originalText);

  logger.info(`Rotate element ${index} initialized successfully`);
};

const setAccessibilityAttributes = (element: HTMLElement, text: string) => {
  element.setAttribute('aria-roledescription', 'Rotating text');
  element.setAttribute('aria-label', `Rotating text: ${text}`);
  element.setAttribute('aria-live', 'polite');
};

const repeatTextToMinLength = (text: string, minLength: number): string => {
  let repeatedText = text;
  while (repeatedText.length < minLength) {
    repeatedText += ' ' + text;
  }
  return repeatedText.trim();
};

// 3. Logo Animation
const initLogoAnimation = () => {
  const logotype = document.querySelector('.nav_logo_logotype') as HTMLElement | null;
  const brandmark = document.querySelector('.nav_logo_brandmark') as HTMLElement | null;

  if (!logotype || !brandmark) {
    logger.warn('Logo elements not found. Skipping logo animation.');
    return () => {};
  }

  let logoTrigger: ScrollTrigger | null = null;
  const logoTimeline = gsap.timeline({ paused: true });

  try {
    setupLogoTimeline(logoTimeline, logotype, brandmark);
    logoTrigger = createLogoScrollTrigger(logoTimeline);
    checkInitialScroll(logoTimeline);

    logger.info('Logo animation initialized successfully');
  } catch (error) {
    logger.error('Error initializing logo animation', error as Error);
    if (logoTrigger) {
      logoTrigger.kill();
    }
  }

  return () => {
    if (logoTrigger) {
      logoTrigger.kill();
    }
  };
};

const setupLogoTimeline = (timeline: gsap.core.Timeline, logotype: HTMLElement, brandmark: HTMLElement) => {
  timeline
    .to(logotype, { 
      opacity: CONSTANTS.LOGO_ANIMATION_OPACITY, 
      x: CONSTANTS.LOGO_ANIMATION_X_MOVE, 
      duration: CONSTANTS.LOGO_ANIMATION_DURATION, 
      ease: "power2.inOut" 
    })
    .to(brandmark, { 
      scale: CONSTANTS.LOGO_ANIMATION_SCALE, 
      x: CONSTANTS.LOGO_ANIMATION_X_OFFSET, 
      duration: CONSTANTS.LOGO_ANIMATION_DURATION, 
      ease: "power2.inOut" 
    }, 0);
};

const createLogoScrollTrigger = (timeline: gsap.core.Timeline) => {
  return ScrollTrigger.create({
    start: CONSTANTS.SCROLL_TRIGGER_START,
    end: CONSTANTS.LOGO_ANIMATION_SCROLL_END,
    scrub: CONSTANTS.SCROLL_TRIGGER_SCRUB,
    onUpdate: (self) => {
      timeline.progress(self.progress);
    }
  });
};

const checkInitialScroll = (timeline: gsap.core.Timeline) => {
  if (window.scrollY > 0) {
    const progress = Math.min(window.scrollY / CONSTANTS.MAX_SCROLL_PROGRESS, 1);
    timeline.progress(progress);
  }
};

// Add this new function after the other animation functions
const initHeadingEffects = () => {
  console.log('initHeadingEffects called');
  const elements = document.querySelectorAll('[data-effect]');
  console.log(`Found ${elements.length} elements with data-effect`);

  elements.forEach((element) => {
    const effect = element.getAttribute('data-effect');
    console.log(`Applying effect: ${effect || 'none'} to element:`, element);
    
    if (effect === 'word-fade') {
      wordFadeEffect(element);
    } else if (effect === 'unmask') {
      unmaskEffect(element as HTMLElement);
    } else if (effect === '') {
      console.log('Element has empty data-effect attribute, skipping');
    } else if (effect === null) {
      console.log('Element has data-effect attribute with no value, skipping');
    } else {
      console.warn(`Unknown effect: ${effect}`);
    }
  });
};

const wordFadeEffect = (element: Element) => {
  const split = new SplitType(element, { types: 'words' });
  
  gsap.fromTo(split.words, 
    {
      opacity: 0,
      y: 30
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom-=150',
        end: 'top center',
        toggleActions: 'play none none reverse',
        scrub: 0.5,
        onEnter: () => element.classList.add('visible'),
        onLeaveBack: () => element.classList.remove('visible')
      }
    }
  );
};

const unmaskEffect = (element: HTMLElement) => {
  console.log('Applying unmask effect to element:', element);
  const visualWrap = element.classList.contains('u-visual-wrap') ? element : element.querySelector('.u-visual-wrap');
  if (!visualWrap) {
    console.warn('No .u-visual-wrap found for unmask effect');
    return;
  }

  gsap.set(visualWrap, { 
    clipPath: 'inset(100% 0 0 0)',
  });

  gsap.to(visualWrap, {
    clipPath: 'inset(0% 0 0 0)',
    duration: 1.5,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      end: 'bottom 40%',
      toggleActions: 'play none none reverse',
    }
  });

  console.log('Unmask effect applied');
};

// Add this new function after the other animation functions
const initializeMarquee = () => {
  const marquees = document.querySelectorAll('[wb-data="marquee"]');

  marquees.forEach((marquee, index) => {
    try {
      setupMarquee(marquee as HTMLElement, index);
    } catch (error) {
      logger.error(`Error in marquee initialization for marquee ${index}`, error as Error);
      (marquee as HTMLElement).classList.remove('hidden');
    }
  });
};

const setupMarquee = (marquee: HTMLElement, index: number) => {
  marquee.classList.add('hidden');

  const marqueeContent = marquee.firstElementChild as HTMLElement;
  if (!marqueeContent) {
    logger.warn(`Marquee ${index} has no content`);
    marquee.classList.remove('hidden');
    return;
  }

  const marqueeContentClone = marqueeContent.cloneNode(true) as HTMLElement;
  marquee.appendChild(marqueeContentClone);

  const width = marqueeContent.offsetWidth;
  const gap = parseInt(getComputedStyle(marqueeContent).getPropertyValue("--grid-gap--main"), 10) || 0;
  const distanceToTranslate = width + gap;

  const startMarquee = () => {
    gsap.to(marquee.children, {
      x: -distanceToTranslate,
      duration: CONSTANTS.MARQUEE_ANIMATION_DURATION,
      ease: "linear",
      repeat: -1,
      overwrite: "auto",
      modifiers: {
        x: (x: string) => `${parseFloat(x) % distanceToTranslate}px`
      }
    });
    marquee.classList.remove('hidden');
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startMarquee();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: CONSTANTS.MARQUEE_INTERSECTION_THRESHOLD });

  observer.observe(marquee);

  setMarqueeAccessibilityAttributes(marquee);
};

const setMarqueeAccessibilityAttributes = (marquee: HTMLElement) => {
  marquee.setAttribute('aria-roledescription', 'Marquee');
  marquee.setAttribute('aria-live', 'off');
  marquee.setAttribute('aria-atomic', 'false');
};

// Add this new function after the other animation functions
const initializeSVGAnimations = () => {
  const svgElements = document.querySelectorAll('.home_marque_image svg');

  if (svgElements.length === 0) {
    logger.warn('No SVG elements found for 3D flip.');
    return;
  }

  svgElements.forEach((svgElement) => {
    try {
      setupSVGFlip(svgElement as SVGElement);
    } catch (error) {
      logger.error('Error in SVG flip animation setup', error as Error);
    }
  });
};

const setupSVGFlip = (svgElement: SVGElement) => {
  gsap.set(svgElement.parentElement, { perspective: 1000 });

  let currentFlip = 0;
  let targetFlip = 0;
  let lastScrollY = window.scrollY;

  const updateFlip = () => {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;

    targetFlip += scrollDelta * CONSTANTS.SVG_FLIP_INTENSITY;
    currentFlip += (targetFlip - currentFlip) * CONSTANTS.SVG_FLIP_SMOOTHNESS;

    gsap.set(svgElement, {
      rotationY: currentFlip,
      transformOrigin: "center center"
    });

    requestAnimationFrame(updateFlip);
  };

  updateFlip();
};

// Add this new function after the other animation functions
const initializeListAnimations = () => {
  const lists = document.querySelectorAll('[data-effect="list"]');

  lists.forEach(list => {
    try {
      const items = gsap.utils.toArray(list.children);

      gsap.set(items, {
        opacity: 0,
        y: 50,
        willChange: "opacity, transform"
      });

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: CONSTANTS.LIST_ANIMATION_DURATION,
        stagger: CONSTANTS.LIST_ANIMATION_STAGGER,
        ease: "power2.out",
        scrollTrigger: {
          trigger: list,
          start: CONSTANTS.LIST_ANIMATION_START,
          end: CONSTANTS.LIST_ANIMATION_END,
          toggleActions: "play none none reverse",
        }
      });
    } catch (error) {
      logger.error('Error in list animation setup', error as Error);
    }
  });
};

// ===== Main Initialization Function =====
const init = () => {
  logger.info('init function called');
  try {
    const lenis = initLenis();
    logger.info('Lenis initialized successfully');

    // Hero Animation (already checked)
    const heroSVG = document.querySelector('#hero-svg');
    if (heroSVG) {
      initHeroAnimation();
    } else {
      logger.info('Hero SVG not found, skipping hero animation');
    }

    // Rotate Elements
    if (document.querySelectorAll('[data-element="circletype"]').length > 0) {
      initializeRotateElements();
    } else {
      logger.info('No rotate elements found, skipping rotation animations');
    }

    // Logo Animation
    const logoElements = document.querySelectorAll('.nav_logo_logotype, .nav_logo_brandmark');
    if (logoElements.length === 2) {
      const cleanupLogoAnimation = initLogoAnimation();
    } else {
      logger.info('Logo elements not found, skipping logo animation');
    }

    // Marquee
    if (document.querySelectorAll('[wb-data="marquee"]').length > 0) {
      initializeMarquee();
    } else {
      logger.info('No marquee elements found, skipping marquee animations');
    }

    // SVG Animations
    if (document.querySelectorAll('.home_marque_image svg').length > 0) {
      initializeSVGAnimations();
    } else {
      logger.info('No SVG elements found for 3D flip, skipping SVG animations');
    }

    // List Animations
    if (document.querySelectorAll('[data-effect="list"]').length > 0) {
      initializeListAnimations();
    } else {
      logger.info('No list elements found, skipping list animations');
    }

    // Heading Effects and Unmask Effects
    window.addEventListener('load', () => {
      if (document.querySelectorAll('[data-effect]').length > 0) {
        console.log('Window loaded, initializing effects');
        initHeadingEffects();
      } else {
        logger.info('No elements with data-effect found, skipping effects');
      }
    });

    startRAF(lenis);
    logger.info('Started RAF');

    const handleResize = debounce(() => {
      logger.info('Resize event detected');
      lenis.resize();
    }, CONSTANTS.RESIZE_DEBOUNCE_TIME);

    window.addEventListener('resize', handleResize, { passive: true });

    const cleanup = () => {
      stopRAF();
      window.removeEventListener('resize', handleResize);
      cleanupLogoAnimation();
      lenis.destroy();
    };

    window.addEventListener('beforeunload', cleanup);

    return cleanup;
  } catch (error) {
    logger.error('Error in main initialization', error as Error);
    showErrorToUser('An error occurred during initialization. Please refresh the page.');
  }
};

// Make sure to call init when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  logger.info('DOMContentLoaded event fired');
  init();
});

// Helper function to show errors to the user (implementation depends on your UI)
function showErrorToUser(message: string) {
  // Implement this function based on your UI requirements
  console.error(message);
  // For example: display an error modal or a toast notification
}



