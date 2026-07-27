"use client";

import { useEffect } from "react";
import axios from "axios";

export default function ThemeProvider() {
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get("/api/settings/theme");
        if (res.data) {
          const theme = res.data;

          const root = document.documentElement;
          // Apply standard Tailwind/Global colors based on the admin choices
          if (theme.primaryColor)
            root.style.setProperty("--primary-color", theme.primaryColor);
          if (theme.headingColor)
            root.style.setProperty("--heading-color", theme.headingColor);
          if (theme.textColor)
            root.style.setProperty("--text-color", theme.textColor);
          if (theme.buttonBgColor)
            root.style.setProperty("--btn-bg", theme.buttonBgColor);
          if (theme.buttonTextColor)
            root.style.setProperty("--btn-text", theme.buttonTextColor);
          if (theme.backgroundColor) {
            root.style.setProperty("--background-color", theme.backgroundColor);
            root.style.setProperty("--background", theme.backgroundColor);
            document.body.style.backgroundColor = theme.backgroundColor;
          }
          if (theme.footerBgColor)
            root.style.setProperty("--footer-bg", theme.footerBgColor);
          if (theme.footerTextColor)
            root.style.setProperty("--footer-text", theme.footerTextColor);
          if (theme.navbarBgColor)
            root.style.setProperty("--navbar-bg", theme.navbarBgColor);
          if (theme.navbarTextColor) {
            root.style.setProperty("--navbar-text", theme.navbarTextColor);
            root.style.setProperty(
              "--navbar-text-rgb",
              hexToRgb(theme.navbarTextColor),
            );
          }

          document.body.style.color = theme.textColor || "#000000";
        }
      } catch (error) {
        console.error("Failed to fetch dynamic theme:", error);
      }
    };

    fetchTheme();
  }, []);

  return null;
}

// Helper to convert hex to rgb for opacity usage if needed
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "17, 24, 39";
}
