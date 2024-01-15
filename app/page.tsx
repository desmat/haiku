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
  const haiku = [
    "Cherry blossoms fall,",
    "A gentle rain of petals,",
    "Spring's fleeting beauty."
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
      <div className='text-overlay italic _bg-pink-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-max'>
          <div>{haiku[0]}</div>
          <div>{haiku[1]}</div>
          <div>{haiku[2]}</div>
        </div>
    </Page>
  )
}
