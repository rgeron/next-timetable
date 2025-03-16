import React from "react";

type ThemedBorderProps = {
  theme: string;
  title?: string;
  children: React.ReactNode;
  fontFamily?: string;
};

export function ThemedBorder({
  theme,
  title,
  children,
  fontFamily = "Inter",
}: ThemedBorderProps) {
  // If no theme or theme is "none", just render children
  if (!theme || theme === "none") {
    return <>{children}</>;
  }

  // Get theme styles based on theme
  const { containerClass, titlePosition } = getThemeStyles(theme);

  return (
    <div
      className={`relative w-full h-full ${containerClass}`}
      style={{ aspectRatio: "1.414/1" }}
    >
      {theme && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={`/borders/${theme}-border.png`}
            alt={`${theme} theme`}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {title && (
        <div
          className="absolute z-10 text-white text-center"
          style={{
            ...titlePosition,
            fontFamily: fontFamily,
          }}
        >
          <h1 className="text-3xl font-bold">{title}</h1>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[90%] h-[76%] max-w-[1000px] mt-2">{children}</div>
      </div>
    </div>
  );
}

function getThemeStyles(theme: string) {
  switch (theme) {
    case "superhero":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titlePosition: {
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "space":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titlePosition: {
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "nature":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titlePosition: {
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "solid-color":
      return {
        containerClass: "rounded-lg overflow-hidden bg-blue-500/10",
        titlePosition: {
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    default:
      return {
        containerClass: "",
        titlePosition: {
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
  }
}
