import React from "react";

type ThemedBorderProps = {
  theme: string;
  title?: string;
  children: React.ReactNode;
};

export function ThemedBorder({ theme, title, children }: ThemedBorderProps) {
  // If no theme or theme is "none", just render children
  if (!theme || theme === "none") {
    return <>{children}</>;
  }

  // Get theme styles based on theme
  const { containerClass, titleClass, backgroundImage, titlePosition } =
    getThemeStyles(theme);

  return (
    <div
      className={`relative w-full h-full ${containerClass}`}
      style={{ aspectRatio: "1.414/1" }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={backgroundImage}
            alt={`${theme} theme`}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {title && (
        <div className={`absolute z-10 ${titleClass}`} style={titlePosition}>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[75%] h-[75%] max-w-[900px]">{children}</div>
      </div>
    </div>
  );
}

function getThemeStyles(theme: string) {
  switch (theme) {
    case "superhero":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titleClass: "bg-red-600 text-white px-6 py-2 rounded-md",
        backgroundImage: "/borders/superhero-border.png",
        titlePosition: {
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "space":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titleClass: "bg-indigo-800 text-white px-6 py-2 rounded-md",
        backgroundImage: "/borders/space-border.png",
        titlePosition: {
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "nature":
      return {
        containerClass: "rounded-lg overflow-hidden",
        titleClass: "bg-green-700 text-white px-6 py-2 rounded-md",
        backgroundImage: "/borders/nature-border.png",
        titlePosition: {
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    case "solid-color":
      return {
        containerClass: "rounded-lg overflow-hidden bg-blue-500/10",
        titleClass: "bg-blue-600 text-white px-6 py-2 rounded-md",
        backgroundImage: "",
        titlePosition: {
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
    default:
      return {
        containerClass: "",
        titleClass: "",
        backgroundImage: "",
        titlePosition: {
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
        },
      };
  }
}
