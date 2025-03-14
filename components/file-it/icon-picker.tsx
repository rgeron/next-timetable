"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

// Liste d'émojis avec leurs mots-clés associés pour la recherche
const ICON_DATA = [
  // Matières scolaires
  {
    icon: "📚",
    keywords: [
      "livre",
      "livres",
      "book",
      "books",
      "education",
      "étude",
      "study",
      "bibliothèque",
      "library",
    ],
  },
  {
    icon: "📘",
    keywords: ["livre", "book", "bleu", "blue", "education", "étude", "study"],
  },
  {
    icon: "📗",
    keywords: ["livre", "book", "vert", "green", "education", "étude", "study"],
  },
  {
    icon: "📙",
    keywords: ["livre", "book", "orange", "education", "étude", "study"],
  },
  {
    icon: "📕",
    keywords: ["livre", "book", "rouge", "red", "education", "étude", "study"],
  },
  {
    icon: "📓",
    keywords: ["cahier", "notebook", "notes", "education", "étude", "study"],
  },
  {
    icon: "📔",
    keywords: ["cahier", "notebook", "notes", "education", "étude", "study"],
  },
  {
    icon: "📒",
    keywords: ["cahier", "notebook", "notes", "education", "étude", "study"],
  },
  {
    icon: "📝",
    keywords: [
      "notes",
      "écrire",
      "write",
      "crayon",
      "pencil",
      "education",
      "étude",
      "study",
    ],
  },
  {
    icon: "✏️",
    keywords: [
      "crayon",
      "pencil",
      "écrire",
      "write",
      "dessin",
      "draw",
      "education",
    ],
  },
  {
    icon: "📐",
    keywords: [
      "règle",
      "ruler",
      "triangle",
      "géométrie",
      "geometry",
      "math",
      "mathématiques",
      "mathematics",
    ],
  },
  {
    icon: "📏",
    keywords: [
      "règle",
      "ruler",
      "géométrie",
      "geometry",
      "math",
      "mathématiques",
      "mathematics",
    ],
  },
  {
    icon: "🧮",
    keywords: [
      "calculatrice",
      "calculator",
      "abacus",
      "math",
      "mathématiques",
      "mathematics",
      "calcul",
    ],
  },
  {
    icon: "🔬",
    keywords: [
      "microscope",
      "science",
      "biologie",
      "biology",
      "laboratoire",
      "laboratory",
      "chimie",
      "chemistry",
    ],
  },
  {
    icon: "🔭",
    keywords: [
      "télescope",
      "telescope",
      "astronomie",
      "astronomy",
      "science",
      "espace",
      "space",
    ],
  },
  {
    icon: "🧪",
    keywords: [
      "tube",
      "test",
      "chimie",
      "chemistry",
      "science",
      "laboratoire",
      "laboratory",
    ],
  },
  {
    icon: "🧫",
    keywords: [
      "boîte",
      "petri",
      "biologie",
      "biology",
      "science",
      "laboratoire",
      "laboratory",
    ],
  },
  {
    icon: "🧬",
    keywords: [
      "adn",
      "dna",
      "biologie",
      "biology",
      "science",
      "génétique",
      "genetics",
    ],
  },
  {
    icon: "🔍",
    keywords: [
      "loupe",
      "magnifier",
      "recherche",
      "search",
      "détective",
      "detective",
    ],
  },
  {
    icon: "🌍",
    keywords: [
      "terre",
      "earth",
      "globe",
      "monde",
      "world",
      "géographie",
      "geography",
    ],
  },
  {
    icon: "🌎",
    keywords: [
      "terre",
      "earth",
      "globe",
      "monde",
      "world",
      "géographie",
      "geography",
    ],
  },
  {
    icon: "🌏",
    keywords: [
      "terre",
      "earth",
      "globe",
      "monde",
      "world",
      "géographie",
      "geography",
    ],
  },
  {
    icon: "🗺️",
    keywords: ["carte", "map", "géographie", "geography", "monde", "world"],
  },
  {
    icon: "🧠",
    keywords: [
      "cerveau",
      "brain",
      "psychologie",
      "psychology",
      "esprit",
      "mind",
      "penser",
      "think",
    ],
  },
  {
    icon: "💻",
    keywords: [
      "ordinateur",
      "computer",
      "laptop",
      "informatique",
      "computing",
      "programmation",
      "programming",
    ],
  },
  {
    icon: "🖥️",
    keywords: [
      "ordinateur",
      "computer",
      "desktop",
      "informatique",
      "computing",
      "programmation",
      "programming",
    ],
  },
  {
    icon: "🖱️",
    keywords: [
      "souris",
      "mouse",
      "informatique",
      "computing",
      "ordinateur",
      "computer",
    ],
  },
  {
    icon: "⌨️",
    keywords: [
      "clavier",
      "keyboard",
      "informatique",
      "computing",
      "ordinateur",
      "computer",
    ],
  },
  {
    icon: "🎨",
    keywords: [
      "palette",
      "palette",
      "art",
      "peinture",
      "painting",
      "couleur",
      "color",
    ],
  },
  {
    icon: "🎭",
    keywords: [
      "théâtre",
      "theater",
      "masque",
      "mask",
      "drame",
      "drama",
      "comédie",
      "comedy",
    ],
  },
  {
    icon: "🎬",
    keywords: [
      "clap",
      "cinéma",
      "cinema",
      "film",
      "movie",
      "réalisation",
      "directing",
    ],
  },
  {
    icon: "🎵",
    keywords: ["note", "musique", "music", "mélodie", "melody", "son", "sound"],
  },
  {
    icon: "🎹",
    keywords: [
      "piano",
      "clavier",
      "keyboard",
      "musique",
      "music",
      "instrument",
    ],
  },
  {
    icon: "🎸",
    keywords: ["guitare", "guitar", "musique", "music", "instrument", "rock"],
  },
  {
    icon: "🎻",
    keywords: [
      "violon",
      "violin",
      "musique",
      "music",
      "instrument",
      "classique",
      "classical",
    ],
  },
  {
    icon: "🎷",
    keywords: ["saxophone", "sax", "musique", "music", "instrument", "jazz"],
  },
  {
    icon: "🎺",
    keywords: [
      "trompette",
      "trumpet",
      "musique",
      "music",
      "instrument",
      "jazz",
    ],
  },
  {
    icon: "🥁",
    keywords: [
      "batterie",
      "drums",
      "musique",
      "music",
      "instrument",
      "percussion",
    ],
  },
  { icon: "🏀", keywords: ["basketball", "basket", "sport", "balle", "ball"] },
  { icon: "⚽", keywords: ["football", "soccer", "sport", "ballon", "ball"] },
  {
    icon: "🏈",
    keywords: ["football", "américain", "american", "sport", "ballon", "ball"],
  },
  { icon: "⚾", keywords: ["baseball", "sport", "balle", "ball"] },
  {
    icon: "🎾",
    keywords: ["tennis", "sport", "balle", "ball", "raquette", "racket"],
  },
  { icon: "🏐", keywords: ["volleyball", "volley", "sport", "ballon", "ball"] },
  { icon: "🏉", keywords: ["rugby", "sport", "ballon", "ball"] },
  { icon: "🎱", keywords: ["billard", "pool", "8", "ball", "sport", "balle"] },
  {
    icon: "🏓",
    keywords: ["ping", "pong", "tennis", "table", "sport", "balle", "ball"],
  },
  {
    icon: "🏸",
    keywords: [
      "badminton",
      "sport",
      "volant",
      "shuttlecock",
      "raquette",
      "racket",
    ],
  },

  // Activités et loisirs
  {
    icon: "🎮",
    keywords: [
      "jeu",
      "vidéo",
      "game",
      "video",
      "manette",
      "controller",
      "gaming",
    ],
  },
  {
    icon: "🎲",
    keywords: ["dé", "dice", "jeu", "game", "hasard", "chance", "board"],
  },
  {
    icon: "🎯",
    keywords: [
      "cible",
      "target",
      "dard",
      "dart",
      "précision",
      "precision",
      "jeu",
      "game",
    ],
  },
  {
    icon: "🎳",
    keywords: [
      "bowling",
      "quille",
      "pin",
      "boule",
      "ball",
      "sport",
      "jeu",
      "game",
    ],
  },
  {
    icon: "🎪",
    keywords: ["cirque", "circus", "chapiteau", "tent", "spectacle", "show"],
  },
  {
    icon: "🎠",
    keywords: ["carrousel", "carousel", "cheval", "horse", "manège", "ride"],
  },
  {
    icon: "🎡",
    keywords: [
      "grande",
      "roue",
      "ferris",
      "wheel",
      "parc",
      "park",
      "attraction",
    ],
  },
  {
    icon: "🎢",
    keywords: [
      "montagnes",
      "russes",
      "roller",
      "coaster",
      "parc",
      "park",
      "attraction",
    ],
  },
  { icon: "🧩", keywords: ["puzzle", "jeu", "game", "pièce", "piece"] },
  {
    icon: "🎰",
    keywords: ["machine", "slot", "casino", "jeu", "game", "hasard", "chance"],
  },
  {
    icon: "🎭",
    keywords: [
      "théâtre",
      "theater",
      "masque",
      "mask",
      "drame",
      "drama",
      "comédie",
      "comedy",
    ],
  },
  {
    icon: "🎨",
    keywords: [
      "palette",
      "palette",
      "art",
      "peinture",
      "painting",
      "couleur",
      "color",
    ],
  },
  { icon: "🧵", keywords: ["fil", "thread", "couture", "sewing", "textile"] },
  { icon: "🧶", keywords: ["laine", "yarn", "tricot", "knitting", "crochet"] },
  {
    icon: "📷",
    keywords: ["appareil", "photo", "camera", "photographie", "photography"],
  },
  {
    icon: "📸",
    keywords: [
      "appareil",
      "photo",
      "camera",
      "flash",
      "photographie",
      "photography",
    ],
  },
  {
    icon: "📹",
    keywords: [
      "caméra",
      "camera",
      "vidéo",
      "video",
      "film",
      "enregistrement",
      "recording",
    ],
  },
  {
    icon: "📺",
    keywords: [
      "télévision",
      "television",
      "tv",
      "écran",
      "screen",
      "média",
      "media",
    ],
  },
  {
    icon: "📻",
    keywords: ["radio", "musique", "music", "son", "sound", "média", "media"],
  },
  {
    icon: "🎧",
    keywords: [
      "casque",
      "headphones",
      "écouteurs",
      "earphones",
      "musique",
      "music",
      "audio",
    ],
  },
  {
    icon: "🏊‍♀️",
    keywords: [
      "natation",
      "swimming",
      "piscine",
      "pool",
      "eau",
      "water",
      "sport",
    ],
  },
  {
    icon: "🚴‍♀️",
    keywords: ["vélo", "cycling", "bicyclette", "bicycle", "cyclisme", "sport"],
  },
  {
    icon: "🧗‍♀️",
    keywords: [
      "escalade",
      "climbing",
      "montagne",
      "mountain",
      "rocher",
      "rock",
      "sport",
    ],
  },
  {
    icon: "🏄‍♀️",
    keywords: [
      "surf",
      "vague",
      "wave",
      "planche",
      "board",
      "mer",
      "sea",
      "sport",
    ],
  },
  { icon: "🏌️‍♀️", keywords: ["golf", "club", "balle", "ball", "sport"] },
  {
    icon: "🏇",
    keywords: [
      "équitation",
      "horse",
      "riding",
      "cheval",
      "course",
      "race",
      "sport",
    ],
  },
  {
    icon: "🧘‍♀️",
    keywords: [
      "yoga",
      "méditation",
      "meditation",
      "zen",
      "posture",
      "pose",
      "sport",
    ],
  },
  {
    icon: "⛹️‍♀️",
    keywords: ["basketball", "basket", "dribble", "balle", "ball", "sport"],
  },
  {
    icon: "🤸‍♀️",
    keywords: ["gymnastique", "gymnastics", "acrobatie", "acrobatics", "sport"],
  },
  { icon: "🤼‍♀️", keywords: ["lutte", "wrestling", "combat", "fight", "sport"] },
  {
    icon: "🎭",
    keywords: [
      "théâtre",
      "theater",
      "masque",
      "mask",
      "drame",
      "drama",
      "comédie",
      "comedy",
    ],
  },
  {
    icon: "🎬",
    keywords: [
      "clap",
      "cinéma",
      "cinema",
      "film",
      "movie",
      "réalisation",
      "directing",
    ],
  },
  {
    icon: "🎨",
    keywords: [
      "palette",
      "palette",
      "art",
      "peinture",
      "painting",
      "couleur",
      "color",
    ],
  },
  {
    icon: "🎭",
    keywords: [
      "théâtre",
      "theater",
      "masque",
      "mask",
      "drame",
      "drama",
      "comédie",
      "comedy",
    ],
  },
  {
    icon: "🎪",
    keywords: ["cirque", "circus", "chapiteau", "tent", "spectacle", "show"],
  },
  {
    icon: "🎤",
    keywords: [
      "micro",
      "microphone",
      "chant",
      "singing",
      "karaoké",
      "karaoke",
      "musique",
      "music",
    ],
  },
  {
    icon: "🎧",
    keywords: [
      "casque",
      "headphones",
      "écouteurs",
      "earphones",
      "musique",
      "music",
      "audio",
    ],
  },
  { icon: "🎼", keywords: ["partition", "score", "musique", "music", "note"] },
  {
    icon: "🎵",
    keywords: ["note", "musique", "music", "mélodie", "melody", "son", "sound"],
  },
  {
    icon: "🎶",
    keywords: [
      "notes",
      "musique",
      "music",
      "mélodie",
      "melody",
      "son",
      "sound",
    ],
  },
  {
    icon: "🎹",
    keywords: [
      "piano",
      "clavier",
      "keyboard",
      "musique",
      "music",
      "instrument",
    ],
  },
  {
    icon: "🎷",
    keywords: ["saxophone", "sax", "musique", "music", "instrument", "jazz"],
  },
  {
    icon: "🎺",
    keywords: [
      "trompette",
      "trumpet",
      "musique",
      "music",
      "instrument",
      "jazz",
    ],
  },
  {
    icon: "🎸",
    keywords: ["guitare", "guitar", "musique", "music", "instrument", "rock"],
  },
  {
    icon: "🎻",
    keywords: [
      "violon",
      "violin",
      "musique",
      "music",
      "instrument",
      "classique",
      "classical",
    ],
  },
  {
    icon: "🥁",
    keywords: [
      "batterie",
      "drums",
      "musique",
      "music",
      "instrument",
      "percussion",
    ],
  },
];

type IconPickerProps = {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  onClose: () => void;
};

export function IconPicker({
  selectedIcon,
  onSelectIcon,
  onClose,
}: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIcon, setCurrentIcon] = useState(selectedIcon);

  // Filtrer les icônes en fonction du terme de recherche
  const filteredIcons = searchTerm
    ? ICON_DATA.filter((iconData) =>
        iconData.keywords.some((keyword) =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ).map((iconData) => iconData.icon)
    : ICON_DATA.map((iconData) => iconData.icon);

  const handleIconSelect = (icon: string) => {
    setCurrentIcon(icon);
  };

  const handleApply = () => {
    onSelectIcon(currentIcon);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Choisir une icône</h3>
        <div className="w-8 h-8 flex items-center justify-center text-xl border rounded">
          {currentIcon}
        </div>
      </div>

      <Input
        placeholder="Rechercher une icône..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      <ScrollArea className="h-[200px] border rounded-md p-2">
        <div className="grid grid-cols-8 gap-1">
          {filteredIcons.map((icon, index) => (
            <button
              key={index}
              className={`w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded ${
                currentIcon === icon ? "bg-muted ring-2 ring-primary" : ""
              }`}
              onClick={() => handleIconSelect(icon)}
            >
              {icon}
            </button>
          ))}
        </div>
        {filteredIcons.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            Aucune icône trouvée
          </div>
        )}
      </ScrollArea>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Annuler
        </Button>
        <Button size="sm" onClick={handleApply}>
          Appliquer
        </Button>
      </div>
    </div>
  );
}
