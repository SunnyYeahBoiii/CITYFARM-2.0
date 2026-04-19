import type { Metadata } from "next";
import { PlantDetailScreen } from "@/components/cityfarm/features/PlantDetailScreen";
import { getPlants } from "@/lib/cityfarm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plantId: string }>;
}): Promise<Metadata> {
  return {
    title: "Plant Detail",
  }
}

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ plantId: string }>;
}) {
  const { plantId } = await params;

  return <PlantDetailScreen plantId={plantId} />;
}
