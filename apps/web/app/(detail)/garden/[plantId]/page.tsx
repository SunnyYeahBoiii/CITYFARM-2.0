import { notFound } from "next/navigation";
import { PlantDetailScreen } from "../../../../components/cityfarm/screens";
import { getPlantById } from "../../../../lib/cityfarm-data";

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;
  const plant = getPlantById(plantId);

  if (!plant) {
    notFound();
  }

  return <PlantDetailScreen plant={plant} />;
}
