import { cookies } from "next/headers";
import { BsGithub } from "react-icons/bs";
import { MdMail, MdHome } from "react-icons/md";
import { GenerateLink } from "@/app/_components/HomePage";
import Link from "@/app/_components/Link"
import Page from "@/app/_components/Page";
import * as users from "@/services/users";
import * as font from "./font";
import shuffleArray from "@/utils/shuffleArray";
import { Haiku } from "@/types/haiku";
import { NavProfileLink } from "./_components/nav/clientComponents";

export default async function Component() {
  // console.log('>> app.page.render()');
  const token = cookies().get("session")?.value;
  const user = token && (await users.getUserFromToken(token))?.user;

  const haikus = [
    {
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
    {
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
    {
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
    {
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
    {
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
    {
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
  ]
  // const haiku = [
  //   "Fiery sunset fades,",
  //   "Day's last light kisses the sea,",
  //   "Evening's embrace.",
  // ];

  // const haiku = [
  // "Cherry blossoms fall,",
  // "A gentle rain of petals,",
  // "Spring's fleeting beauty."
  // ];

  // const haiku = [
  // "Snow blankets the field,",
  // "Silence in the winter air,",
  // "Nature's hush descends.",
  // ]

  // const haiku = [
  //   "Primarch Peter stands,",
  //   "Worlds fall in his mighty wake,",
  //   "Galactic warrior.",
  // ];

  const haiku = haikus[Math.floor(Math.random() * haikus.length)];

  // console.log('>> app.page.render()', { token, user });

  const textStyle = {
    color: haiku.color,
    filter: `drop-shadow(0px 0px 8px ${haiku.bgColor})`,
  }

  const links = [
    <div key="web" style={textStyle}>
      <Link useClient={true} href="https://www.desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
        {/* <MdHome className=" _mt-[0.1rem] _mr-[-0.2rem] text-xl" /> */}
        www.desmat.ca
      </Link>
    </div>,
    <div key="email" style={textStyle}>
      <Link useClient={true} key="email" href="mailto:haiku@desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-1 items-center">
        {/* <MdMail className="_mt-[0.05rem] _mr-[-0.25rem] text-xl" /> */}
        @desmat.ca
      </Link>
    </div>,
    <div key="github" style={textStyle}>
      <Link useClient={true} key="github" href="https://github.com/desmat/haiku" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
        <BsGithub className="mt-[0.1rem] text-md" />
        desmat
      </Link>
    </div>,
  ];

  return (
    <Page
      // title="Haiku"
      // subtitle="Perfect workout plans, just for you!"
      bottomLinks={links}
    >
      <div style={textStyle} className={`${font.architects_daughter.className} fixed top-2 left-3 z-20 text-[22pt]`}>
        <Link useClient={true} href="/">
          <span className={font.architects_daughter.className}>h<span className={`${font.inter.className} tracking-[-2px] pr-[3px] pl-[1px] text-[16pt]`}>AI</span>ku</span>
        </Link>
      </div>
      <div className="fixed top-4 right-3 z-20" style={textStyle}>
        <NavProfileLink href="/profile" className="_bg-orange-600 title-overlay text-overlay _hover: _text-purple-100" />
      </div>
      <div
        className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        style={{
          backgroundImage: `url("${haiku.bgImage}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "brightness(1.2)",
        }}
      />
      <div
        className={`fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0`}
        style={{
          background: `radial-gradient(circle at center, white, #868686 50%, ${haiku.color} 85%)`,
          opacity: 0.6,
        }}
      />
      <div
        className={`${font.architects_daughter.className} md:text-[26pt] sm:text-[22pt] text-[16pt] _bg-pink-200 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100vw-2rem)] z-20`}
        style={textStyle}
      >
        {haiku.poem.map((s: string) => <div>{s}</div>)}
      </div>
    </Page>
  )
}
