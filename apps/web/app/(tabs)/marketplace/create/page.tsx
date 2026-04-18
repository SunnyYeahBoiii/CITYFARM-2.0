import { MarketplaceCreateScreen } from "@/components/cityfarm/features/MarketplaceCreateScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Listing | CityFarm",
  description: "List your fresh harvested produce on the CityFarm marketplace.",
};

export default async function MarketplaceCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const plantId = params.plantId as string;

  if (!plantId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 text-4xl">🌱</div>
        <h1 className="text-xl font-bold text-[#1f2916]">Selection Refuired</h1>
        <p className="mt-2 text-sm text-[#677562]">
          Please select a plant from your garden to list for sale.
        </p>
      </div>
    );
  }

  return <MarketplaceCreateScreen plantId={plantId} />;
}
