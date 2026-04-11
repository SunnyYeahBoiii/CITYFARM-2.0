import { ChatbotScreen } from "../../components/chatbot/ChatbotScreen";
import { getPlantById } from "../../lib/cityfarm-data";
import { plantToChatContext } from "../../lib/plant-chat-context";

export default async function ChatbotPage({
  searchParams,
}: {
  searchParams: Promise<{ plantId?: string }>;
}) {
  const { plantId } = await searchParams;
  const plant = plantId ? getPlantById(plantId) : undefined;
  const initialContext = plant ? plantToChatContext(plant) : null;

  return (
    <ChatbotScreen
      initialContext={initialContext}
      backHref={plant ? `/garden/${plant.id}` : "/home"}
      plantName={plant?.name ?? null}
      plantHealth={plant?.health ?? null}
    />
  );
}
