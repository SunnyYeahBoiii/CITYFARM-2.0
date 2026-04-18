import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedPlantScreen } from "@/components/cityfarm/features/SharedPlantScreen";
import { getPlantById } from "@/lib/cityfarm-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plantId: string }>;
}): Promise<Metadata> {
  return {
    title: "Shared Plant",
  }
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
