import { CommunityScreen } from "../../../components/cityfarm/features/CommunityScreen";
import { getCommunityData } from "../../../lib/community-server";

export default async function CommunityPage() {
  const { posts, listings } = await getCommunityData();

  return <CommunityScreen initialPosts={posts} initialListings={listings} />;
}
