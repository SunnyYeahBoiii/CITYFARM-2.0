import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedPlantScreen } from "../../../../../components/cityfarm/features/SharedPlantScreen";
import { getPlantById } from "../../../../../lib/cityfarm-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plantId: string }>;
}): Promise<Metadata> {
  const { plantId } = await params;
  const plant = getPlantById(plantId);

  if (!plant) {
    return {
      title: "Shared Plant",
    };
  }

  return {
    title: `${plant.name} | Shared Plant`,
    description: `Inspect the shared timeline and journal for ${plant.name}.`,
  };
}

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
