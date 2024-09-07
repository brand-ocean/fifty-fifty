





const colorTheme = [];
const htmlStyles = getComputedStyle(document.documentElement);
const targetStylesheet = document.querySelector(".page_code_color style");
const regex = /--([^:\s]+):\s*var\(--([^)]+)\);/g;
colorTheme.push({});

if (targetStylesheet) {
  const rules = targetStylesheet.sheet.cssRules || targetStylesheet.sheet.rules;
  for (const rule of rules) {
    if (rule.cssText.includes("data-theme=") && !rule.cssText.includes(`data-theme="inherit"`)) {
      const styleObject = {};
      let match;
      while ((match = regex.exec(rule.cssText)) !== null) {
        const key = "--" + match[1];
        const value = htmlStyles.getPropertyValue("--" + match[2]);
        styleObject[key] = value;
      }
      colorTheme.push(styleObject);
    }
  }
}

// Function to apply theme based on color scheme
function applyTheme(isDarkMode, animate = true) {
  const pageWrap = document.querySelector('.page_wrap');
  const targetTheme = isDarkMode ? 'dark' : 'inherit';
  const themeIndex = isDarkMode ? 2 : 1; // Assuming dark theme is at index 2, light at 1

  if (animate) {
    gsap.to(".page_wrap", {
      ...colorTheme[themeIndex],
      duration: 0.5, // Adjust duration as needed
      onComplete: () => {
        pageWrap.setAttribute('data-theme', targetTheme);
        document.documentElement.setAttribute('data-theme', targetTheme);
      }
    });
  } else {
    pageWrap.setAttribute('data-theme', targetTheme);
    document.documentElement.setAttribute('data-theme', targetTheme);
    gsap.set(".page_wrap", colorTheme[themeIndex]);
  }
}

// Function to check and apply theme
function checkAndApplyTheme(animate = true) {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(isDarkMode, animate);
}

// Initial theme application
checkAndApplyTheme(true);

// Listen for changes in color scheme
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
colorSchemeQuery.addListener(() => checkAndApplyTheme(true));

// Fallback: check periodically for changes
setInterval(() => checkAndApplyTheme(true), 1000);

// Additional event listeners for when the page becomes visible
document.addEventListener("visibilitychange", () => checkAndApplyTheme(true));
window.addEventListener("focus", () => checkAndApplyTheme(true));

// */