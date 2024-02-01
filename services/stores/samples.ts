import { Haiku } from "@/types/Haiku";

export const notFoundHaiku = {
  id: "404notfound",
  theme: "not finding what you wanted",
  bgImage: "/backgrounds/DALL·E 2024-01-17 11.32.41 - An extremely muted, almost monochromatic painting in the Japanese style, depicting the concept of emptiness. The artwork captures a minimalist landsca.png",
  color: "#4a5247",
  bgColor: "#ffffff",
  colorPalette: ['#5f685c', '#747369', '#767c6b', '#b0b3a6', '#e1ddce'],
  poem: [
    "Quest ends in silence,",
    "'404 Not Found' echoes,",
    "Lost in digital.",
  ],
}

export const notFoundHaikudle = {
  id: "404notfound",
  haiku: notFoundHaiku,
  inProgress: [
    [
      {
        "id": "e2ce6319",
        "offset": 0,
        "word": "lost",
        "syllables": 1,
        "picked": false,
        "correct": false
      },
      {
        "id": "46bd7984",
        "offset": 1,
        "word": "quest",
        "syllables": 1,
        "picked": false,
        "correct": false
      },
      {
        "id": "8b4f46e1",
        "offset": 2,
        "word": "ends",
        "syllables": 1,
        "picked": false,
        "correct": false
      },
      {
        "id": "f3d8a0c3",
        "offset": 3,
        "word": "in",
        "syllables": 1,
        "picked": false,
        "correct": false
      },
      {
        "id": "8d9cbc0e",
        "offset": 4,
        "word": "echoes,",
        "syllables": 2,
        "picked": false,
        "correct": false
      }
    ],
    [
      {
        "id": "b0dc6cbd",
        "offset": 5,
        "word": "'404",
        "syllables": 0,
        "picked": false,
        "correct": true
      },
      {
        "id": "d565a833",
        "offset": 6,
        "word": "not",
        "syllables": 1,
        "picked": false,
        "correct": true
      },
      {
        "id": "1233c602",
        "offset": 7,
        "word": "found'",
        "syllables": 1,
        "picked": false,
        "correct": true
      }
    ],
    [
      {
        "id": "40ccf23f",
        "offset": 8,
        "word": "in",
        "syllables": 1,
        "picked": false,
        "correct": false
      },
      {
        "id": "8a0c7e4e",
        "offset": 9,
        "word": "digital.",
        "syllables": 3,
        "picked": false,
        "correct": false
      },
      {
        "id": "7ba3e9ab",
        "offset": 10,
        "word": "silence,",
        "syllables": 2,
        "picked": false,
        "correct": false
      }
    ]
  ],
}

export const haikus = {
  "1": {
    id: "1",
    theme: "sunset",
    bgImage: "/backgrounds/DALL·E 2024-01-09 18.43.26 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a sunset. The artwork captures the serene beauty of a sunset, with .png",
    color: "rgb(32, 31, 27)",
    bgColor: "rgb(131, 127, 111)",
    poem: [
      "Fiery sunset fades,",
      "Day's last light kisses the sea,",
      "Evening's embrace.",
    ],
  },
  "2": {
    id: "2",
    theme: "cherry blossoms",
    bgImage: "/backgrounds/DALL·E 2024-01-09 18.45.07 - An extremely muted, almost monochromatic painting in the Japanese style, featuring cherry blossoms. The artwork captures the delicate beauty of cherry.png",
    color: "rgb(38, 35, 32)",
    bgColor: "rgb(153, 143, 128)",
    poem: [
      "Cherry blossoms fall,",
      "A gentle rain of petals,",
      "Spring's fleeting beauty."
    ],
  },
  "3": {
    id: "3",
    theme: "winter",
    bgImage: "/backgrounds/DALL·E 2024-01-15 17.55.09 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a winter snow scene. The artwork captures the quiet beauty of a sno.png",
    color: "rgb(44, 44, 42)",
    bgColor: "rgb(176, 178, 168)",
    poem: [
      "Snow blankets the field,",
      "Silence in the winter air,",
      "Nature's hush descends.",
    ],
  },
  "4": {
    id: "4",
    theme: "Desert at dusk.",
    bgImage: "/backgrounds/DALL·E 2024-01-16 13.26.56 - An extremely muted, almost monochromatic painting in the Japanese style, depicting a desert at dusk. The artwork captures the tranquil and vast expans.png",
    color: "rgb(23, 21, 21)",
    bgColor: "rgb(92, 87, 84)",
    poem: [
      "Desert sands at dusk,",
      "Shadows stretch, the sun retreats,",
      "Silent, endless peace.",
    ],
  },
  "5": {
    id: "5",
    theme: "Mountain peaks",
    bgImage: "/backgrounds/DALL·E 2024-01-16 13.32.57 - An extremely muted, almost monochromatic painting in the Japanese style, featuring mountain peaks. The artwork captures the majestic and rugged beauty.png",
    color: "rgb(32, 31, 28)",
    bgColor: "rgb(128, 126, 114)",
    poem: [
      "Mountain peaks in mist,",
      "Ancient guardians of stone,",
      "Whispers of old earth.",
    ],
  },
  "6": {
    id: "6",
    theme: "fishing in the ocean",
    bgImage: "/backgrounds/DALL·E 2024-01-16 13.37.57 - An extremely muted, almost monochromatic painting in the Japanese style, depicting a scene of fishing in the ocean. The artwork captures a tranquil oc.png",
    color: "rgb(36, 37, 29)",
    bgColor: "rgb(147, 149, 118)",
    poem: [
      "Ocean's depth beckons,",
      "Lines cast into the blue vast,",
      "Patience meets the tide.",
    ],
  },
  "7": {
    id: "7",
    theme: "fishing in the ocean",
    bgImage: "/backgrounds/working the rice fields.png",
    color: "#555555",
    bgColor: "lightgrey",
    poem: [
      "Green fields stretch far wide,",
      "Bent backs greet the rising sun,",
      "Harvest's toil begins.",
    ],
  }, "8": {
    id: "8",
    theme: "summer in paris",
    bgImage: "/backgrounds/img-CTZdNCy7NnbBiZNiYFX4lZBv.png",
    color: "#555555",
    bgColor: "lightgrey",
    poem: [
      "Parisian summer,",
      "Cafés alive with chatter,",
      "Sun kisses the Seine.",
    ],
  },
};
