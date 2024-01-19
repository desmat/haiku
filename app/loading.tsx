import { Loading, NavOverlay } from "./_components/nav/Nav";

export default async function Page() {
  return (
    <div>
      <NavOverlay />
      <Loading />
    </div>
  )
}
