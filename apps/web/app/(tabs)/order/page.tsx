import { OrderScreen } from "../../../components/cityfarm/screens";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const { seed } = await searchParams;

  return <OrderScreen initialSeed={seed ?? null} />;
}
