import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMessengerPanel } from "@/contexts/MessengerContext";
import { MessengerPanelContent } from "./MessengerPanelContent";

export function MessengerPanel() {
  const { open, setOpen } = useMessengerPanel();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col gap-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Messenger</SheetTitle>
        </SheetHeader>
        <MessengerPanelContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
