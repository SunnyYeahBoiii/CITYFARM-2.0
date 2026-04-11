import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlantDetailScreen } from "../../../../components/cityfarm/features/PlantDetailScreen";
import { getPlantById } from "../../../../lib/cityfarm-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plantId: string }>;
}): Promise<Metadata> {
  const { plantId } = await params;
  const plant = getPlantById(plantId);

  if (!plant) {
    return {
      title: "Plant Detail",
    };
  }

  return {
    title: `${plant.name} | Garden`,
    description: `Track ${plant.name} growth, care logs, and journal progress in your CITYFARM garden.`,
  };
}

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
