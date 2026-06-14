import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, FileText, Upload } from "lucide-react";
import HomeworkList from "@/components/homework/HomeworkList";
import HomeworkSubmissionForm from "@/components/homework/HomeworkSubmissionForm";
import { useAuth } from "@/hooks/useAuth";

export default function HomeworkPage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Mock data - in real app, fetch from API
  const classes = [
    { id: "1", name: "Class 10", sections: [{ id: "1", name: "A" }] },
    { id: "2", name: "Class 10", sections: [{ id: "2", name: "B" }] },
    { id: "3", name: "Class 9", sections: [{ id: "3", name: "A" }] },
  ];

  const renderTeacherView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Create New Homework</span>
          </CardTitle>
          <CardDescription>
            Assign homework to your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Create Homework Assignment</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Homework Assignments</span>
          </CardTitle>
          <CardDescription>
            View and manage homework assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length > 0 && (
            <div className="mb-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.sections[0]?.name && `- ${cls.sections[0].name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <HomeworkList classId={selectedClass || undefined} />
        </CardContent>
      </Card>
    </div>
  );

  const renderStudentView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Upcoming Homework</span>
          </CardTitle>
          <CardDescription>
            Submit homework before the due date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <HomeworkList />
            </TabsContent>
            <TabsContent value="submitted" className="mt-4">
              <HomeworkList />
            </TabsContent>
            <TabsContent value="reviewed" className="mt-4">
              <HomeworkList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Homework</h1>
        <p className="text-gray-600 mt-2">
          {user?.role === "teacher" ? "Manage and assign homework to students" : "View and submit homework assignments"}
        </p>
      </div>

      {user?.role === "teacher" ? renderTeacherView() : renderStudentView()}
    </div>
  );
}