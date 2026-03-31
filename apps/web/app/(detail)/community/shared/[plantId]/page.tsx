import { notFound } from "next/navigation";
import { SharedPlantScreen } from "../../../../../components/cityfarm/screens";
import { getPlantById } from "../../../../../lib/cityfarm-data";

export default async function SharedPlantPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;
  const plant = getPlantById(plantId);

  if (!plant) {
    notFound();
  }

  return <SharedPlantScreen plant={plant} />;
}
