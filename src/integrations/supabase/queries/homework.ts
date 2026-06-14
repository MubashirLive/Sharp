import { createClient } from "@/integrations/supabase/client";
import { generateIdempotencyKey } from "@/hooks/useAuthenticatedMutation";

export interface Homework {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  attached_file?: string;
  attached_file_name?: string;
  attached_file_size?: number;
  submitted_by: string;
  assigned_to_class?: string;
  assigned_to_section?: string;
  subject_id: string;
  due_date: string;
  is_submitted: boolean;
  status: "draft" | "published" | "archived";
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_profile_id: string;
  submission_type: "photo" | "text" | "paper_done";
  submission_text?: string;
  submission_photo_url?: string;
  submission_photo_bucket?: string;
  submission_photo_name?: string;
  submission_photo_size?: number;
  submitted_at?: string;
  marked_by?: string;
  marked_at?: string;
  marks?: number;
  comments?: string;
  status: "pending" | "submitted" | "reviewed" | "returned" | "late";
  school_id: string;
  created_at: string;
  updated_at: string;
}

const supabase = createClient();

export const homeworkQueries = {
  // Get all homework for a school
  getHomework: async (schoolId: string) => {
    const { data, error } = await supabase
      .from("homework")
      .select(`
        *,
        submitted_by_profile:staff_profiles!inner(
          full_name,
          profile_id
        ),
        assigned_class:classes!inner(
          name,
          acronym,
          sections:sections!inner(
            name,
            acronym
          )
        ),
        subject:subjects!inner(
          name,
          acronym
        )
      `)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as (Homework & {
      submitted_by_profile: { full_name: string; profile_id: string };
      assigned_class: {
        name: string;
        acronym: string;
        sections: Array<{ name: string; acronym: string }>;
      };
      subject: { name: string; acronym: string };
    })[];
  },

  // Get homework by ID
  getHomeworkById: async (id: string) => {
    const { data, error } = await supabase
      .from("homework")
      .select(`
        *,
        submitted_by_profile:staff_profiles!inner(
          full_name,
          profile_id,
          profile:profiles!inner(
            email,
            role
          )
        ),
        assigned_class:classes!inner(
          name,
          acronym,
          sections:sections!inner(
            name,
            acronym
          )
        ),
        subject:subjects!inner(
          name,
          acronym
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Homework & {
      submitted_by_profile: {
        full_name: string;
        profile_id: string;
        profile: { email: string; role: string };
      };
      assigned_class: {
        name: string;
        acronym: string;
        sections: Array<{ name: string; acronym: string }>;
      };
      subject: { name: string; acronym: string };
    };
  },

  // Create new homework
  createHomework: async (homework: Omit<Homework, "id" | "created_at" | "updated_at">) => {
    const idempotencyKey = generateIdempotencyKey();
    const { data, error } = await supabase
      .from("homework")
      .insert([homework])
      .select()
      .single();

    if (error) throw error;
    return data as Homework;
  },

  // Update homework
  updateHomework: async (id: string, updates: Partial<Homework>) => {
    const idempotencyKey = generateIdempotencyKey();
    const { data, error } = await supabase
      .from("homework")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Homework;
  },

  // Delete homework
  deleteHomework: async (id: string) => {
    const idempotencyKey = generateIdempotencyKey();
    const { error } = await supabase
      .from("homework")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get submissions for a homework
  getSubmissions: async (homeworkId: string) => {
    const { data, error } = await supabase
      .from("homework_submissions")
      .select(`
        *,
        student:student_profiles!inner(
          full_name,
          class_id,
          profile:profiles!inner(
            email
          )
        ),
        marked_by_profile:staff_profiles!inner(
          full_name
        )
      `)
      .eq("homework_id", homeworkId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as (HomeworkSubmission & {
      student: {
        full_name: string;
        class_id: string;
        profile: { email: string };
      };
      marked_by_profile: { full_name: string };
    })[];
  },

  // Submit homework
  submitHomework: async (submission: Omit<HomeworkSubmission, "id" | "created_at" | "updated_at">) => {
    const idempotencyKey = generateIdempotencyKey();
    const { data, error } = await supabase
      .from("homework_submissions")
      .insert([submission])
      .select()
      .single();

    if (error) throw error;
    return data as HomeworkSubmission;
  },

  // Update submission status/marks
  updateSubmission: async (id: string, updates: Partial<HomeworkSubmission>) => {
    const idempotencyKey = generateIdempotencyKey();
    const { data, error } = await supabase
      .from("homework_submissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as HomeworkSubmission;
  },

  // Get student's submissions
  getStudentSubmissions: async (studentId: string) => {
    const { data, error } = await supabase
      .from("homework_submissions")
      .select(`
        *,
        homework:homework!inner(
          title,
          due_date,
          subject:subjects!inner(
            name,
            acronym
          ),
          assigned_class:classes!inner(
            name,
            acronym
          ),
          submitted_by_profile:staff_profiles!inner(
            full_name
          )
        )
      `)
      .eq("student_profile_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Array<{
      id: string;
      status: string;
      submitted_at?: string;
      marked_at?: string;
      marks?: number;
      comments?: string;
      homework: {
        title: string;
        due_date: string;
        subject: { name: string; acronym: string };
        assigned_class: { name: string; acronym: string };
        submitted_by_profile: { full_name: string };
      };
    }>;
  },

  // Get class attendance data for dashboard
  getClassHomeworkStats: async (classId: string) => {
    const { data, error } = await supabase
      .from("homework_submissions")
      .select("status")
      .eq("homework_id", (await supabase
        .from("homework")
        .select("id")
        .eq("assigned_to_class", classId)
        .order("created_at", { ascending: false })
        .limit(1)
      ).data?.[0]?.id);

    if (error) throw error;

    const stats = {
      total: data.length,
      submitted: data.filter(s => s.status === "submitted").length,
      pending: data.filter(s => s.status === "pending").length,
      reviewed: data.filter(s => s.status === "reviewed").length,
    };

    return stats;
  },
};