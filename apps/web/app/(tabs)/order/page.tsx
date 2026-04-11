import { OrderScreen } from "../../../components/cityfarm/features/OrderScreen";

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ seed?: string }>;
}) {
  const { seed } = await searchParams;

  return <OrderScreen initialSeed={seed ?? null} />;
}
