import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Palmtree, Mic, ClipboardList, PartyPopper, CalendarDays, Upload, X, Plus } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calendarEventSchema,
  type CalendarEventFormData,
  eventTypeOptions,
  scopeOptions,
  dateTypeOptions,
  halfDayFractions,
  CalendarEvent,
} from "@/hooks/useCalendar";
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useCancelCalendarEvent,
} from "@/hooks/useCalendar";
import { useDepartments } from "@/hooks/useCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { uploadEventAttachment } from "@/integrations/supabase/queries/calendar";
import { EventPreview } from "./EventPreview";

const TYPE_DEFAULTS: Record<string, { icon: React.ElementType; label: string }> = {
  holiday: { icon: Palmtree, label: "Declare Holiday" },
  working_override: { icon: CalendarDays, label: "Working Day Override" },
  school_event: { icon: PartyPopper, label: "Announce Event" },
  class_event: { icon: PartyPopper, label: "Class Event" },
  staff_meeting: { icon: Mic, label: "Schedule Meeting" },
  staff_task: { icon: ClipboardList, label: "Assign Task" },
  exam_timetable: { icon: CalendarDays, label: "Exam Timetable" },
};

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEventType?: string;
  editEvent?: CalendarEvent | null;
  schoolId: string;
  calendarId: string;
  wings?: { id: string; name: string }[];
  classes?: { id: string; name: string }[];
  staff?: { id: string; full_name: string }[];
  academicYearId: string;
  onSuccess?: () => void;
}

export function EventForm({
  open,
  onOpenChange,
  defaultEventType = "school_event",
  editEvent,
  schoolId,
  calendarId,
  wings = [],
  classes = [],
  staff = [],
  academicYearId,
  onSuccess,
}: EventFormProps) {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const cancelMutation = useCancelCalendarEvent();
  const { data: departmentsData } = useDepartments(schoolId);

  const form = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: {
      dateType: "one_day",
      date: "",
      endDate: "",
      specificDates: [],
      eventType: defaultEventType as CalendarEventFormData["eventType"],
      title: "",
      detail: "",
      scope: "all",
      scopeIds: [],
      includeStudents: true,
      isHalfDay: false,
      halfDayFraction: "",
      notify: true,
      notifyAt: "",
      scheduledPublishAt: "",
      examId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setShowPreview(false);
      setAttachmentFiles([]);
      setSelectedDates([]);
      return;
    }
    if (editEvent) {
      let specificDates: string[] = [];
      try {
        specificDates = editEvent.specific_dates ?? [];
      } catch {}
      form.reset({
        dateType: editEvent.end_date
          ? "multi_day"
          : specificDates.length > 0
          ? "selected_days"
          : "one_day",
        date: editEvent.date,
        endDate: editEvent.end_date ?? "",
        specificDates,
        eventType: editEvent.event_type as CalendarEventFormData["eventType"],
        title: editEvent.title,
        detail: editEvent.detail ?? "",
        scope: editEvent.scope as CalendarEventFormData["scope"],
        scopeIds: editEvent.scope_ids ?? [],
        includeStudents: editEvent.include_students ?? true,
        isHalfDay: editEvent.is_half_day ?? false,
        halfDayFraction: editEvent.half_day_fraction ?? "",
        notify: editEvent.notify ?? true,
        notifyAt: editEvent.notify_at ?? "",
        scheduledPublishAt: editEvent.scheduled_publish_at ?? "",
        examId: editEvent.exam_id ?? "",
      });
      setSelectedDates(specificDates);
    } else {
      form.reset({
        dateType: "one_day",
        date: "",
        endDate: "",
        specificDates: [],
        eventType: defaultEventType as CalendarEventFormData["eventType"],
        title: "",
        detail: "",
        scope: "all",
        scopeIds: [],
        includeStudents: true,
        isHalfDay: false,
        halfDayFraction: "",
        notify: true,
        notifyAt: "",
        scheduledPublishAt: "",
        examId: "",
      });
      setSelectedDates([]);
    }
  }, [open, editEvent, form, defaultEventType]);

  const dateType = form.watch("dateType");
  const scope = form.watch("scope");
  const isHalfDay = form.watch("isHalfDay");

  const typeMeta = TYPE_DEFAULTS[eventType] ?? { icon: CalendarDays, label: "Event" };
  const TypeIcon = typeMeta.icon;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachmentFiles((prev) => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  }, []);

  const handlePreview = form.handleSubmit(() => {
    form.setValue("specificDates", selectedDates);
    setShowPreview(true);
  });

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Upload attachments first
      let attachmentUrls: string[] = [];
      for (const file of attachmentFiles) {
        const { url } = await uploadEventAttachment(
          file,
          schoolId,
          editEvent?.id ?? `temp-${Date.now()}`
        );
        attachmentUrls.push(url);
      }

      const formData = form.getValues();
      const base = {
        schoolId,
        calendarId,
        date: formData.date,
        endDate: formData.dateType === "multi_day" ? formData.endDate : undefined,
        specificDates: formData.dateType === "selected_days" ? selectedDates : undefined,
        eventType: formData.eventType,
        title: formData.title,
        detail: formData.detail,
        scope: formData.scope,
        scopeIds: formData.scopeIds,
        includeStudents: formData.includeStudents,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        isHalfDay: formData.isHalfDay,
        halfDayFraction: formData.halfDayFraction || undefined,
        notify: formData.notify,
        notifyAt: formData.notifyAt || undefined,
        scheduledPublishAt:
          formData.scheduledPublishAt || undefined,
        declaredBy: user.id,
      };

      let result;
      if (editEvent) {
        result = await updateMutation.mutateAsync({
          id: editEvent.id,
          payload: {
            date: formData.date,
            endDate: formData.dateType === "multi_day" ? formData.endDate : undefined,
            specificDates: formData.dateType === "selected_days" ? selectedDates : undefined,
            eventType: formData.eventType,
            title: formData.title,
            detail: formData.detail,
            scope: formData.scope,
            scopeIds: formData.scopeIds,
            includeStudents: formData.includeStudents,
            attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
            isHalfDay: formData.isHalfDay,
            halfDayFraction: formData.halfDayFraction || undefined,
            notify: formData.notify,
            notifyAt: formData.notifyAt || undefined,
            scheduledPublishAt: formData.scheduledPublishAt || undefined,
            examId: formData.examId,
          },
        });
      } else {
        result = await createMutation.mutateAsync(base);
      }

      if (result.error) {
        toast.error(editEvent ? "Failed to update event" : "Failed to create event");
      } else {
        toast.success(editEvent ? "Event updated" : "Event created");
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to process event");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!editEvent || !user) return;
    if (!confirm("Cancel this event? It will be removed from the calendar.")) return;

    const result = await cancelMutation.mutateAsync({
      id: editEvent.id,
      cancelledBy: user.id,
    });

    if (result.error) {
      toast.error("Failed to cancel event");
    } else {
      toast.success("Event cancelled");
      onSuccess?.();
      onOpenChange(false);
    }
  };

  const generateDateOptions = () => {
    const options: { value: string; label: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= 90; i++) {
      const date = addDays(today, i);
      const value = format(date, "yyyy-MM-dd");
      options.push({ value, label: format(date, "EEE, dd MMM yyyy") });
    }
    return options;
  };

  const canEdit = editEvent && new Date(editEvent.date) >= new Date();
  const isPastEvent = editEvent && new Date(editEvent.date) < new Date();

  if (showPreview) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <EventPreview
            event={{
              title: form.getValues("title"),
              date: form.getValues("date"),
              end_date: form.getValues("endDate") || null,
              specific_dates: selectedDates,
              detail: form.getValues("detail"),
              scope: form.getValues("scope"),
              scope_ids: form.getValues("scopeIds") || null,
              include_students: form.getValues("includeStudents"),
              attachment_urls: attachmentFiles.map((f) => f.name),
              notify: form.getValues("notify"),
            }}
            dateType={form.getValues("dateType")}
            onConfirm={handleSubmit}
            onEdit={() => setShowPreview(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>
              {editEvent ? (isPastEvent ? "View Event" : "Edit Event") : typeMeta.label}
            </DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} className="space-y-4">
            {/* Date Type Selector */}
            {!editEvent && (
              <FormField
                control={form.control}
                name="dateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Type</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(v) => {
                          if (v) {
                            field.onChange(v);
                            setSelectedDates([]);
                          }
                        }}
                        className="flex flex-wrap gap-1"
                      >
                        {dateTypeOptions.map((opt) => (
                          <ToggleGroupItem key={opt.value} value={opt.value} size="sm">
                            {opt.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Single Date */}
            {(dateType === "one_day" || !dateType) && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date {!editEvent && "*"}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={editEvent ? undefined : format(addDays(new Date(), 1), "yyyy-MM-dd")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Multi-Day: Start + End */}
            {dateType === "multi_day" && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={format(addDays(new Date(), 1), "yyyy-MM-dd")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={form.getValues("date") || format(addDays(new Date(), 1), "yyyy-MM-dd")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Selected Days */}
            {dateType === "selected_days" && (
              <FormItem>
                <FormLabel>Select Dates *</FormLabel>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {generateDateOptions().map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                    >
                      <Checkbox
                        checked={selectedDates.includes(opt.value)}
                        onCheckedChange={() => toggleDate(opt.value)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {selectedDates.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDates.length} date(s) selected
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}

            {/* Event Type */}
            {!editEvent && (
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(v) => v && field.onChange(v)}
                        className="flex flex-wrap gap-1"
                      >
                        {eventTypeOptions.map((opt) => (
                          <ToggleGroupItem key={opt.value} value={opt.value} size="sm">
                            {opt.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Annual Day Celebration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detail */}
            <FormField
              control={form.control}
              name="detail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional details..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scope */}
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies To</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {scopeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department Selector */}
            {scope === "department" && departmentsData?.data && (
              <FormField
                control={form.control}
                name="scopeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Department</FormLabel>
                    <Select
                      value={field.value?.[0] ?? ""}
                      onValueChange={(v) => field.onChange([v])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentsData.data.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Wing Selector */}
            {scope === "wing" && wings.length > 0 && (
              <FormField
                control={form.control}
                name="scopeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Wing</FormLabel>
                    <Select
                      value={field.value?.[0] ?? ""}
                      onValueChange={(v) => field.onChange([v])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wing" />
                      </SelectTrigger>
                      <SelectContent>
                        {wings.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Class Selector */}
            {scope === "class" && classes.length > 0 && (
              <FormField
                control={form.control}
                name="scopeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Class</FormLabel>
                    <Select
                      value={field.value?.[0] ?? ""}
                      onValueChange={(v) => field.onChange([v])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Individual Selector */}
            {scope === "individual" && staff.length > 0 && (
              <FormField
                control={form.control}
                name="scopeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      value={field.value?.[0] ?? ""}
                      onValueChange={(v) => field.onChange([v])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Student Inclusion Toggle */}
            <FormField
              control={form.control}
              name="includeStudents"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Include Students</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Students will receive this event in their calendar
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Half-day (staff only) */}
            {scope === "staff" && (
              <>
                <FormField
                  control={form.control}
                  name="isHalfDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg border">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">Half Day for Staff</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Reduce working hours — fraction applies to salary
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {isHalfDay && (
                  <FormField
                    control={form.control}
                    name="halfDayFraction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fraction</FormLabel>
                        <FormControl>
                          <Select value={field.value ?? ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fraction" />
                            </SelectTrigger>
                            <SelectContent>
                              {halfDayFractions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="event-attachments"
                />
                <label
                  htmlFor="event-attachments"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload files
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Images, PDFs, Documents (max 10MB each)
                  </span>
                </label>
              </div>
              {attachmentFiles.length > 0 && (
                <div className="space-y-2">
                  {attachmentFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                    >
                      <span className="truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-1 hover:bg-muted rounded cursor-pointer"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Publish */}
            {!editEvent && (
              <FormField
                control={form.control}
                name="scheduledPublishAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule for Later</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to publish immediately
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notification */}
            <FormField
              control={form.control}
              name="notify"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Send Notification</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Broadcast to affected users via Messenger
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Exam timetable placeholder */}
            {eventType === "exam_timetable" && (
              <FormField
                control={form.control}
                name="examId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Link to exam (Phase 2)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="gap-2">
              {editEvent && canEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Event
                </Button>
              )}
              {!isPastEvent && (
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editEvent ? "Update Event" : "Preview & Publish"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}