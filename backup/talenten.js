const talentItems = document.querySelectorAll('.talent_split');

talentItems.forEach((item, index) => {
  const contentItem = item.querySelector('.talent_content');
  const visualItem = item.querySelector('.talent_visual');

  if (contentItem && visualItem) {
    const backgroundColor = getComputedStyle(contentItem).backgroundColor;
    const visualBackground = visualItem.querySelector('.g_visual_background');

    if (visualBackground) {
      visualBackground.style.backgroundColor = backgroundColor;
    }

    const talentImage = visualItem.querySelector('.g_visual_img');
    const talentTitle = contentItem.querySelector('.talent_title');

    if (talentImage && talentTitle) {
      // Split the title text
      const splitTitle = new SplitType(talentTitle, { types: 'words, chars' });

      // Set initial states
      gsap.set(splitTitle.chars, {
        opacity: 0,
        y: 20
      });

      gsap.set(talentImage, {
        scale: 1.1,
        clipPath: 'inset(100% 0 0 0)',
        transformOrigin: 'center bottom'
      });

      // Create a timeline for image animation
      gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: index === 0 ? 'top bottom' : 'top center+=20%',
            end: 'bottom center',
            toggleActions: 'play none none reverse',
            // markers: true, // Uncomment this line to see the trigger points
          }
        })
        .to(talentImage, {
          clipPath: 'inset(0% 0 0 0)',
          scale: 1,
          duration: 1,
          ease: 'power2.out',
        });

      // Create a separate timeline for title animation
      gsap.timeline({
          scrollTrigger: {
            trigger: talentTitle,
            start: index === 0 ? 'top bottom' : 'top center+=30%',
            end: 'bottom center',
            toggleActions: 'play none none reverse',
            // markers: true, // Uncomment this line to see the trigger points
          }
        })
        .to(splitTitle.chars, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.03,
          ease: 'power2.out',
        });
    }
  }
});
