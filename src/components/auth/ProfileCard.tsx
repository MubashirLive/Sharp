import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface ProfileCardProps {
  name: string;
  appId: string;
  photoUrl?: string | null;
  tag?: string | null; // Messenger tag for staff or class-section for students
  role: "staff" | "student";
}

export function ProfileCard({ name, appId, photoUrl, tag, role }: ProfileCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const idPrefix = role === "staff" ? "STF" : "SCH";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={photoUrl || undefined} alt={name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{name}</h3>
          <p className="text-sm text-muted-foreground font-mono">{appId}</p>
          {tag && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
              {tag}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
