// ===== PERFORMANCE OPTIMIZATION: Shared rafCallback =====
// ===== REFACTORED PERFORMANCE OPTIMIZATION: Shared rafCallback =====
const rafCallback = (callback) => {
    let ticking = false;
    return (event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          callback(event);
          ticking = false;
        });
        ticking = true;
      }
    };
  };
  
  // ===== ERROR HANDLING AND LOGGING ===== 
  const logger = {
    logs: [],
    error: (message, error) => {
      console.error(`Error: ${message}`, error);
      logger.logs.push({ level: 'error', message, error });
    },
    warn: (message) => {
      console.warn(`Warning: ${message}`);
      logger.logs.push({ level: 'warn', message });
    },
    info: (message) => {
      console.info(`Info: ${message}`);
      logger.logs.push({ level: 'info', message });
    }
  };
  
  // ===== LENIS SMOOTH SCROLL INITIALIZATION ===== 
  const initLenis = () => {
    try {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });
  
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
  
      gsap.ticker.lagSmoothing(0);
  
      return lenis;
    } catch (error) {
      logger.error('Failed to initialize Lenis', error);
      return null;
    }
  };
  
  // ===== UTILITY FUNCTIONS ===== 
  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  };
  
  const debounce = (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  };
  
  // ===== SHARED RAF LOOP ===== 
  let rafActive = false;
  const scrollHandlers = [];
  
  const sharedRAF = (lenis) => {
    if (!rafActive) return;
    scrollHandlers.forEach(handler => handler(lenis));
    requestAnimationFrame(() => sharedRAF(lenis));
  };
  
  const startRAF = (lenis) => {
    rafActive = true;
    requestAnimationFrame(() => sharedRAF(lenis));
  };
  
  const stopRAF = () => {
    rafActive = false;
  };
  
  // ===== ROTATE ELEMENTS ===== 
  const initializeRotateElements = () => {
    const rotateElements = document.querySelectorAll('[data-element="rotate"]');
    const baseSpeed = 12;
    const boostSpeed = 30;
    const acceleration = 0.2;
    const deceleration = 0.3;
  
    rotateElements.forEach((element, index) => {
      try {
        element.classList.add('hidden');
  
        // Get the original text
        const originalText = element.textContent.trim();
  
        // Function to repeat text to minimum length
        const repeatTextToMinLength = (text, minLength) => {
          let repeatedText = text;
          while (repeatedText.length < minLength) {
            repeatedText += ' ' + text;
          }
          return repeatedText.trim();
        };
  
        // Ensure text is at least 12 characters long
        const repeatedText = repeatTextToMinLength(originalText, 22);
        element.textContent = repeatedText;
  
        new CircleType(element);
  
        // Rest of the rotation logic...
        let currentSpeed = baseSpeed;
        let currentRotation = 0;
        let scrollDirection = 1;
        let isScrolling = false;
        let lastScrollTime = 0;
        let lastScrollY = window.scrollY;
  
        const updateRotation = () => {
          currentRotation += (currentSpeed / 60) * scrollDirection;
          gsap.set(element, { rotation: currentRotation });
          requestAnimationFrame(updateRotation);
        };
  
        const handleScroll = (direction) => {
          isScrolling = true;
          lastScrollTime = performance.now();
          scrollDirection = direction === 'down' ? 1 : -1;
          currentSpeed = Math.min(boostSpeed, currentSpeed + acceleration * Math.abs(
            currentSpeed));
        };
  
        const onScroll = () => {
          const currentScrollY = window.scrollY;
          const scrollDelta = currentScrollY - lastScrollY;
          lastScrollY = currentScrollY;
  
          if (scrollDelta > 0) {
            handleScroll('down');
          } else if (scrollDelta < 0) {
            handleScroll('up');
          }
        };
  
        window.addEventListener('scroll', rafCallback(onScroll));
  
        const slowDown = () => {
          const currentTime = performance.now();
          if (currentTime - lastScrollTime > 100) {
            isScrolling = false;
          }
  
          if (!isScrolling && currentSpeed > baseSpeed) {
            currentSpeed = Math.max(baseSpeed, currentSpeed - deceleration);
          }
  
          requestAnimationFrame(slowDown);
        };
  
        updateRotation();
        slowDown();
  
        if (isInViewport(element)) {
          gsap.fromTo(
            element, { scale: 0.95, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1,
              ease: "power1.out",
              onComplete: () => element.classList.remove('hidden')
            }
          );
        }
  
        element.setAttribute('aria-roledescription', 'Rotating text');
        element.setAttribute('aria-live', 'polite');
  
      } catch (error) {
        logger.error(`Error in rotate element initialization for element ${index}`, error);
        element.classList.remove('hidden');
      }
    });
  };
  
  // ===== MARQUEE ELEMENTS ===== 
  const initializeMarquee = () => {
    const marquees = document.querySelectorAll('[wb-data="marquee"]');
  
    marquees.forEach((marquee, index) => {
      try {
        marquee.classList.add('hidden'); // Initially hide the marquee
  
        const marqueeContent = marquee.firstElementChild;
        if (!marqueeContent) {
          logger.warn(`Marquee ${index} has no content`);
          marquee.classList.remove('hidden'); // Show in case of a warning 
          return;
        }
  
        const marqueeContentClone = marqueeContent.cloneNode(true);
        marquee.appendChild(marqueeContentClone);
  
        // Getting the marquee dimensions 
        const width = marqueeContent.offsetWidth;
        const gap = parseInt(getComputedStyle(marqueeContent).getPropertyValue(
          "--grid-gap--main"), 10) || 0;
        const distanceToTranslate = width + gap;
  
        const startMarquee = () => {
          gsap.to(marquee.children, {
            x: -distanceToTranslate,
            duration: 60, // Default duration for smooth animation
            ease: "linear", // Use linear for consistent speed
            repeat: -1, // The animation will repeat indefinitely
            overwrite: "auto",
            modifiers: {
              x: (x) => `${parseFloat(x) % distanceToTranslate}px`
            }
          });
          marquee.classList.remove(
            'hidden'); // Show the marquee now that the animation is set up
        };
  
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              startMarquee();
              observer.unobserve(entry
                .target); // Stop observing once the marquee has been started
            }
          });
        }, { threshold: 0.5 });
  
        observer.observe(marquee);
  
        marquee.setAttribute('aria-roledescription', 'Marquee');
        marquee.setAttribute('aria-live', 'off');
        marquee.setAttribute('aria-atomic', 'false');
  
      } catch (error) {
        logger.error(`Error in marquee initialization for marquee ${index}`, error);
        marquee.classList.remove('hidden'); // Ensure marquee shows even if there was an error 
      }
    });
  };
  
  // ===== ROTATE SVG ELEMENTS ===== 
  // ===== 3D HORIZONTAL FLIP SVG ELEMENTS BASED ON SCROLL POSITION ===== 
  const initializeSVGAnimations = () => {
    const svgElements = document.querySelectorAll('.home_marque_image svg');
  
    if (svgElements.length === 0) {
      logger.warn('No SVG elements found for 3D flip.');
      return;
    }
  
    const flipIntensity = 0.2; // Adjust this to control rotation speed
    const smoothness = 0.05; // Adjust for desired smoothness (lower = smoother)
  
    svgElements.forEach(svgElement => {
      gsap.set(svgElement.parentElement, { perspective: 1000 });
  
      let currentFlip = 0;
      let targetFlip = 0;
      let lastScrollY = window.scrollY;
  
      const updateFlip = () => {
        const scrollY = window.scrollY;
        const scrollDelta = scrollY - lastScrollY;
        lastScrollY = scrollY;
  
        // Update target flip based on scroll delta
        targetFlip += scrollDelta * flipIntensity;
  
        // Smooth interpolation
        currentFlip += (targetFlip - currentFlip) * smoothness;
  
        gsap.set(svgElement, {
          rotationY: currentFlip,
          transformOrigin: "center center"
        });
  
        requestAnimationFrame(updateFlip);
      };
  
      // Start the animation loop
      updateFlip();
    });
  };
  
  // ===== TOGGLE CLICK AND ICON ANIMATION =====
  const initializeClickAnimations = () => {
    const plusIcons = document.querySelectorAll('[data-element="team"]');
  
    plusIcons.forEach((plusIcon) => {
      const infoElement = plusIcon.closest('.team_list_image').querySelector('.team_list_info');
      const verticalRect = plusIcon.querySelector("rect[x]");
      let isVisible = false;
      let isHovered = false;
  
      if (plusIcon && infoElement && verticalRect) {
        gsap.set(infoElement, { opacity: 0, y: '120%', pointerEvents: "none" });
  
        // Hover animation
        plusIcon.addEventListener('mouseenter', () => {
          if (!isVisible) {
            gsap.to(plusIcon, {
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
          isHovered = true;
        });
  
        plusIcon.addEventListener('mouseleave', () => {
          if (!isVisible) {
            gsap.to(plusIcon, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }
          isHovered = false;
        });
  
        // Click animation
        plusIcon.addEventListener('click', () => {
          if (isVisible) {
            gsap.to(infoElement, {
              opacity: 0,
              y: '120%',
              duration: 0.5,
              ease: "power2.out",
              onComplete: () => gsap.set(infoElement, { pointerEvents: "none" })
            });
  
            gsap.to(verticalRect, {
              scaleY: 1,
              transformOrigin: "50% 50%",
              duration: 0.3,
              ease: "power2.out"
            });
  
            if (!isHovered) {
              gsap.to(plusIcon, {
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
              });
            }
  
            isVisible = false;
          } else {
            gsap.to(infoElement, {
              opacity: 1,
              y: '0%',
              duration: 0.4,
              ease: "power2.out",
              clearProps: "pointerEvents"
            });
  
            gsap.to(verticalRect, {
              scaleY: 0,
              transformOrigin: "50% 50%",
              duration: 0.3,
              ease: "power2.out"
            });
  
            gsap.to(plusIcon, {
              scale: 1.1,
              duration: 0.3,
              ease: "power2.out"
            });
  
            isVisible = true;
          }
        });
  
      } else {
        console.error("Could not find the plus icon or info element for click animation.");
      }
    });
  };
  
  // ===== IMAGE UNMASKING ANIMATION =====
  const initializeMaskAnimation = () => {
    const masks = document.querySelectorAll('.image-mask');
  
    masks.forEach((mask) => {
      gsap.to(mask, {
        scaleY: 0,
        transformOrigin: "top",
        ease: "power2.out",
        scrollTrigger: {
          trigger: mask.parentElement,
          start: "top 80%",
          end: "top 30%",
          scrub: true,
        }
      });
    });
  };
  
  // ========== SCROLL TRIGGER LIST ANIMATION ========== 
  const initializeListAnimations = ({
    start = "top 80%",
    end = "bottom 20%",
    duration = 0.8,
    stagger = 0.2,
  
  } = {}) => {
    const lists = document.querySelectorAll('[data-effect="list"]');
  
    lists.forEach(list => {
      const items = gsap.utils.toArray(list.children);
  
      gsap.set(items, {
        opacity: 0,
        y: 50,
        willChange: "opacity, transform"
      });
  
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: duration,
        stagger: stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: list,
          start: start,
          end: end,
          toggleActions: "play none none reverse",
        }
      });
    });
  };
  
  // ===== SCROLLING IMAGE ANIMATION =====
  const initScrollingImage = () => {
    const scrollContainers = document.querySelectorAll('.scroll-container');
  
    scrollContainers.forEach((container, index) => {
      const image = container.querySelector('.scroll-image');
  
      if (image) {
        try {
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          });
  
          scrollTl.to(image, {
            y: () => -(image.offsetHeight - container.offsetHeight),
            ease: "none"
          });
  
          gsap.fromTo(container, { scale: 1 },
          {
            scale: 1.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: container,
              start: "top 60%",
              end: "center top",
              scrub: 0.5,
            }
          });
  
        } catch (error) {
          logger.error(
            `Error in scrolling image initialization for container ${index}`,
            error);
        }
      } else {
        logger.warn(`No image found in scroll container ${index}`);
      }
    });
  };
  
  // ===== INITIALIZE ALL ANIMATIONS =====
  const init = () => {
    let lenis = initLenis();
    if (!lenis) {
      logger.error('Lenis initialization failed. Aborting further initialization.');
      return;
    }
  
    initializeRotateElements(lenis);
    initializeMarquee();
    initializeSVGAnimations();
    initializeClickAnimations();
    initializeMaskAnimation();
    initScrollingImage();
    initializeTextAnimations();
    initializeListAnimations();
  
    // Start the shared RAF loop for scroll-based updates 
    startRAF(lenis);
  
    // Window resize handler 
    const handleResize = debounce(() => {
      lenis.resize();
    }, 200);
    window.addEventListener('resize', handleResize, { passive: true });
  };
  
  // Wait for Webflow to accomplish its own page load and interaction initializations
  Webflow.push(function () {
    init(); // Run our custom initialization with all animations combined
  });
  


  <script>
    (function() {
      var isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'inherit');
    })();
  </script>