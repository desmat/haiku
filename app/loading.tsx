import { Loading, NavOverlay } from "./_components/Nav";

export default async function Page() {
  return (
    <div>
      <NavOverlay />
      <Loading />
    </div>
  )
}
