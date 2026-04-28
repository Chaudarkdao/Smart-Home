export const applyTheme = (isDark) => {
  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

export const initTheme = () => {
  const saved = localStorage.getItem("theme");
  const isDark = saved !== "light"; // mặc định dark
  applyTheme(isDark);
  return isDark;
};