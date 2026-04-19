import { HomeScreen } from "../../../components/cityfarm/features/HomeScreen";
import { getHomeData } from "../../../lib/home-server";

export default async function HomePage() {
  const homeData = await getHomeData();

  return <HomeScreen data={homeData} />;
}
