import { cookies } from "next/headers";
import { BsGithub } from "react-icons/bs";
import { MdMail, MdHome } from "react-icons/md";
import { GenerateLink } from "@/app/_components/HomePage";
import Link from "@/app/_components/Link"
import Page from "@/app/_components/Page";
import * as users from "@/services/users";

export default async function Component() {
  // console.log('>> app.page.render()');
  const token = cookies().get("session")?.value;
  const user = token && (await users.getUserFromToken(token))?.user;

  // const haiku = [
  //   "Fiery sunset fades,",
  //   "Day's last light kisses the sea,",
  //   "Evening's embrace.",
  // ];

  // const haiku = [
  //   "Cherry blossoms fall,",
  //   "A gentle rain of petals,",
  //   "Spring's fleeting beauty."
  // ];

  // const haiku = [
  //   "Snow blankets the field,",
  //   "Silence in the winter air,",
  //   "Nature's hush descends.",
  // ]

  // const haiku = [
  //   "Primarch Peter stands,",
  //   "Worlds fall in his mighty wake,",
  //   "Galactic warrior.",
  // ];

  const haiku = [
    "Amber leaves drift down,",
    "Skyscrapers touch autumn skies,",
    "City in gold hues.",
  ];

  // console.log('>> app.page.render()', { token, user });

  const links = [
    <Link useClient={true} key="web" href="https://www.desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
      {/* <MdHome className=" _mt-[0.1rem] _mr-[-0.2rem] text-xl" /> */}
      www.desmat.ca
    </Link>,
    <Link useClient={true} key="email" href="mailto:haiku@desmat.ca" target="_blank" className="_bg-yellow-200 flex flex-row gap-1 items-center">
      {/* <MdMail className="_mt-[0.05rem] _mr-[-0.25rem] text-xl" /> */}
      @desmat.ca
    </Link>,
    <Link useClient={true} key="github" href="https://github.com/desmat/haiku" target="_blank" className="_bg-yellow-200 flex flex-row gap-0.5 items-center">
      <BsGithub className="mt-[0.1rem] text-md" />
      desmat
    </Link>,
  ];

  return (
    <Page
      // title="Haiku"
      // subtitle="Perfect workout plans, just for you!"
      bottomLinks={links}
    >
      <div
        className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0 opacity-100"
        // _style={{ background: "radial-gradient(circle at center, white, #868686 60%, black 90%)" }}
        style={{
          // backgroundImage: 'url("/backgrounds/DALL·E 2024-01-09 18.45.07 - An extremely muted, almost monochromatic painting in the Japanese style, featuring cherry blossoms. The artwork captures the delicate beauty of cherry.png")',
          // backgroundImage: 'url("/backgrounds/DALL·E 2024-01-09 18.43.26 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a sunset. The artwork captures the serene beauty of a sunset, with .png")',
          // backgroundImage: 'url("/backgrounds/DALL·E 2024-01-15 17.55.09 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a winter snow scene. The artwork captures the quiet beauty of a sno.png")',
          // backgroundImage: 'url("/backgrounds/DALL·E 2024-01-15 18.11.58 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a fictional character named Peter, the Space Marine Primarch and De.png")',
          backgroundImage: 'url("/backgrounds/DALL·E 2024-01-15 18.26.51 - An extremely muted, almost monochromatic painting in the Japanese style, depicting New York City in the fall. The artwork captures the essence of New .png")',
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundColor: `rgb(${rgb})`,
          filter: "brightness(1.2)",
        }}
      />
      <div
        className="fixed top-0 left-0 _bg-pink-200 min-w-[100vw] min-h-[100vh] z-0"
        style={{
          background: "radial-gradient(circle at center, white, #868686 60%, black 90%)",
          opacity: 0.4,
        }}
      />
      <div className='text-overlay poem-overlay italic _bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-max'>
        <div>{haiku[0]}</div>
        <div>{haiku[1]}</div>
        <div>{haiku[2]}</div>
      </div>
    </Page>
  )
}
