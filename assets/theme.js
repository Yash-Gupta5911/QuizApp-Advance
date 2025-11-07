// ================================
//  GLOBAL THEME HANDLER
// ================================

// Load saved theme on page load
const savedTheme = localStorage.getItem("theme");

// If dark mode saved → apply
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeSwitch");

  if (!toggle) return; // safety check

  // Set initial toggle state
  toggle.checked = document.documentElement.classList.contains("dark");

  // Toggle listener
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
});
