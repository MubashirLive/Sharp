import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Camera, Type, CheckCircle, FileText as FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { homeworkQueries, type HomeworkSubmission } from "@/integrations/supabase/queries/homework";

const submissionSchema = z.object({
  submission_type: z.enum(["photo", "text", "paper_done"]),
  submission_text: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface HomeworkSubmissionFormProps {
  homeworkId: string;
  studentId: string;
  onSubmit?: () => void;
}

export default function HomeworkSubmissionForm({
  homeworkId,
  studentId,
  onSubmit,
}: HomeworkSubmissionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: homework,
    isLoading: homeworkLoading,
    error: homeworkError,
  } = useQuery({
    queryKey: ["homework", homeworkId],
    queryFn: () => homeworkQueries.getHomeworkById(homeworkId),
    enabled: !!homeworkId,
  });

  const submitMutation = useMutation({
    mutationFn: (submission: Omit<HomeworkSubmission, "id" | "created_at" | "updated_at">) =>
      homeworkQueries.submitHomework(submission),
    onSuccess: () => {
      toast({
        title: "Homework submitted successfully",
        description: "Your homework has been submitted for review.",
      });
      onSubmit?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit homework",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submission_type: "text",
      submission_text: "",
    },
  });

  const submissionType = watch("submission_type");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  };

  const onFileUpload = async () => {
    if (!selectedFile || !homeworkId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 100));
      }, 200);

      // In a real implementation, this would upload to Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmitHomework = async (data: SubmissionFormData) => {
    if (!homeworkId || !studentId) return;

    let submissionData: Omit<HomeworkSubmission, "id" | "created_at" | "updated_at"> = {
      homework_id: homeworkId,
      student_profile_id: studentId,
      submission_type: data.submission_type,
      status: "submitted",
    };

    if (data.submission_type === "photo" && selectedFile) {
      await onFileUpload();
      // In real implementation, this would be the actual storage URL
      submissionData = {
        ...submissionData,
        submission_photo_url: "https://example.com/files/uploaded.jpg",
        submission_photo_bucket: "homework-submissions",
        submission_photo_name: selectedFile.name,
        submission_photo_size: selectedFile.size,
      };
    } else if (data.submission_type === "text") {
      submissionData = {
        ...submissionData,
        submission_text: data.submission_text,
      };
    }

    submitMutation.mutate(submissionData);
  };

  if (homeworkLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading homework details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (homeworkError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-500">Error loading homework details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Homework</CardTitle>
        <CardDescription>
          {homework?.title} - Due on {homework && new Date(homework.due_date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitHomework)} className="space-y-6">
          {/* Submission Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Submission Type</Label>
            <RadioGroup
              value={submissionType}
              onValueChange={(value) => setValue("submission_type", value as any)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex items-center space-x-2 cursor-pointer">
                  <Type className="h-4 w-4" />
                  <span>Text Answer</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="photo" id="photo" />
                <Label htmlFor="photo" className="flex items-center space-x-2 cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <span>Photo of Work</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paper_done" id="paper_done" />
                <Label htmlFor="paper_done" className="flex items-center space-x-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4" />
                  <span>Done in Notebook</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Text Submission */}
          {submissionType === "text" && (
            <div className="space-y-3">
              <Label htmlFor="submission-text">Your Answer</Label>
              <Textarea
                id="submission-text"
                {...register("submission_text", { required: "Please provide your answer" })}
                placeholder="Type your answer here..."
                rows={6}
              />
              {errors.submission_text && (
                <p className="text-sm text-red-500">{errors.submission_text.message}</p>
              )}
            </div>
          )}

          {/* Photo Submission */}
          {submissionType === "photo" && (
            <div className="space-y-3">
              <Label htmlFor="photo-upload">Upload Photo</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {fileUrl ? (
                  <div className="space-y-3">
                    <img
                      src={fileUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                    <p className="text-sm text-gray-500">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">
                      Upload a photo of your completed homework
                    </p>
                  </div>
                )}
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Paper Done Note */}
          {submissionType === "paper_done" && (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Your teacher will check your notebook in class. Make sure to bring it to school.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || (submissionType === "photo" && !selectedFile && !fileUrl)}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Homework"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}