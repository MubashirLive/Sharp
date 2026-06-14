import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Homework {
  id: string;
  title: string;
  description: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  due_date: string;
  created_by: string;
  created_at: string;
}

interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  submitted_at: string;
  notes: string;
}

export default function HomeworkPage() {
  const { user, school } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newHomework, setNewHomework] = useState({
    title: "",
    description: "",
    classId: "",
    sectionId: "",
    subjectId: "",
    dueDate: ""
  });

  // Only teachers and above can create homework
  const canCreate = user?.role === "principal" || user?.role === "master_admin" ||
                   user?.role === "admin" || user?.role === "teacher";

  const handleCreateHomework = async () => {
    if (!newHomework.title || !newHomework.classId || !newHomework.dueDate) {
      toast({ title: "Missing fields", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("homework").insert({
        school_id: school?.id,
        title: newHomework.title,
        description: newHomework.description,
        class_id: newHomework.classId,
        section_id: newHomework.sectionId,
        subject_id: newHomework.subjectId,
        due_date: newHomework.dueDate,
        created_by: user?.id
      }).select().single();

      if (error) throw error;

      toast({ title: "Homework assigned", description: "Students will be notified" });
      setIsCreateOpen(false);
      setNewHomework({ title: "", description: "", classId: "", sectionId: "", subjectId: "", dueDate: "" });
      setHomeworkList(prev => [...prev, data]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homework</h1>
          <p className="text-muted-foreground">Assign and manage homework</p>
        </div>
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Assign Homework</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Homework</DialogTitle>
                <DialogDescription>Create a new homework assignment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newHomework.title}
                    onChange={e => setNewHomework(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Chapter 5 Exercise"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newHomework.description}
                    onChange={e => setNewHomework(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Instructions for students..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Class *</Label>
                    <Select value={newHomework.classId} onValueChange={v => setNewHomework(prev => ({ ...prev, classId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {/* Classes populated from school data */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={newHomework.dueDate}
                      onChange={e => setNewHomework(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateHomework} disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : "Assign Homework"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active"><Clock className="h-4 w-4 mr-2" />Active</TabsTrigger>
          <TabsTrigger value="submitted"><CheckCircle className="h-4 w-4 mr-2" />Submitted</TabsTrigger>
          <TabsTrigger value="overdue"><AlertCircle className="h-4 w-4 mr-2" />Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {homeworkList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No homework assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {homeworkList.map(hw => (
                <Card key={hw.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{hw.title}</CardTitle>
                    <CardDescription>Due: {new Date(hw.due_date).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{hw.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">Your submitted homework will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-muted-foreground">No overdue homework</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}