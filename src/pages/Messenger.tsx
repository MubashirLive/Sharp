import { MessengerPanelContent } from "@/components/messenger/MessengerPanelContent";

export default function MessengerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      <div className="flex flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
        <MessengerPanelContent />
      </div>
    </div>
  );
}
