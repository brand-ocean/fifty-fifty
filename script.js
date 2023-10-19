$(".nav_wrap").each(function () {
  let hamburgerEl = $(this).find(".nav_hamburger_wrap");
  let navLineEl = $(this).find(".nav_hamburger_line");
  let menuContainEl = $(this).find(".menu_contain");
  let flipItemEl = $(this).find(".nav_hamburger_base");
  let menuWrapEl = $(this).find(".menu_wrap");
  let menuBaseEl = $(this).find(".menu_base");
  let menuLinkEl = $(this).find(".menu_link");

  let flipDuration = 0.6;

  function flip(forwards) {
    let state = Flip.getState(flipItemEl);
    if (forwards) {
      flipItemEl.appendTo(menuContainEl);
    } else {
      flipItemEl.appendTo(hamburgerEl);
    }
    Flip.from(state, { duration: flipDuration });
  }

  let tl = gsap.timeline({ paused: true });
  tl.set(menuWrapEl, { display: "flex" });
  tl.from(menuBaseEl, {
    opacity: 0,
    duration: flipDuration,
    ease: "none",
    onStart: () => {
      flip(true);
    }
  });
  tl.to(navLineEl.eq(0), { y: 4, rotate: 45, duration: flipDuration }, "<");
  tl.to(navLineEl.eq(1), { y: -4, rotate: -45, duration: flipDuration }, "<");
  tl.from(menuLinkEl, {
    opacity: 0,
    yPercent: 50,
    duration: 0.2,
    stagger: { amount: 0.2 },
    onReverseComplete: () => {
      flip(false);
    }
  });

  function openMenu(open) {
    if (!tl.isActive()) {
      if (open) {
        tl.play();
        hamburgerEl.addClass("nav-open");
      } else {
        tl.reverse();
        hamburgerEl.removeClass("nav-open");
      }
    }
  }

  hamburgerEl.on("click", function () {
    if ($(this).hasClass("nav-open")) {
      openMenu(false);
    } else {
      openMenu(true);
    }
  });

  menuBaseEl.on("mouseenter", function () {
    openMenu(false);
  });
  menuBaseEl.on("click", function () {
    openMenu(false);
  });

  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      openMenu(false);
    }
  });
});
