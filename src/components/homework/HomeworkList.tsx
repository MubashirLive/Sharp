import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, FileText, Clock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Skeleton from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { homeworkQueries, type Homework } from "@/integrations/supabase/queries/homework";
import { useAuth } from "@/hooks/useAuth";

const HomeworkList = ({ classId }: { classId?: string }) => {
  const { user } = useAuth();
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const {
    data: homework,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["homework", classId],
    queryFn: () =>
      homeworkQueries.getHomework(
        user?.school_id || "",
        classId ? [classId] : undefined
      ),
    enabled: !!user?.school_id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "published":
        return "Published";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">Error loading homework.</p>
        </CardContent>
      </Card>
    );
  }

  if (!homework || homework.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">No homework assignments found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {homework.map((hw) => (
        <Card key={hw.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{hw.title}</CardTitle>
                <CardDescription>
                  Due on {format(new Date(hw.due_date), "dd MMM yyyy")}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(hw.status)}>
                {getStatusText(hw.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>{hw.subject?.name || "Subject"}</span>
                </div>
                {hw.assigned_class && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>
                      {hw.assigned_class.name} {hw.assigned_class.sections?.[0]?.name && `- ${hw.assigned_class.sections[0].name}`}
                    </span>
                  </div>
                )}
                {hw.submitted_by && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {hw.submitted_by_profile?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500">
                      {hw.submitted_by_profile?.full_name}
                    </span>
                  </div>
                )}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedHomework(hw)}>
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{hw.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {hw.description && (
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{hw.description}</p>
                      </div>
                    )}
                    {hw.instructions && (
                      <div>
                        <h4 className="font-medium mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600">{hw.instructions}</p>
                      </div>
                    )}
                    {hw.attached_file_name && (
                      <div>
                        <h4 className="font-medium mb-2">Attachment</h4>
                        <div className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span>{hw.attached_file_name}</span>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Due Date</h5>
                        <p className="text-sm">{format(new Date(hw.due_date), "dd MMM yyyy")}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Assigned To</h5>
                        <p className="text-sm">
                          {hw.assigned_class?.name} {hw.assigned_class?.sections?.[0]?.name && `- ${hw.assigned_class.sections[0].name}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HomeworkList;