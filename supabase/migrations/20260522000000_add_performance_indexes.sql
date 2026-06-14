-- Performance indexes for 500 schools / 600K users scale
-- Phase 1: Critical indexes on existing tables

-- Profiles indexes (id is primary key, add school_id index)
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_school_status ON students(school_id, status);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_session_id ON classes(session_id);

-- Sections indexes
CREATE INDEX IF NOT EXISTS idx_sections_school_id ON sections(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

-- Academic sessions indexes
CREATE INDEX IF NOT EXISTS idx_academic_sessions_school_id ON academic_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_sessions_school_current ON academic_sessions(school_id, is_current);

-- Calendar indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_school_id ON calendar_events(school_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_school_date ON calendar_events(school_id, date);

-- School calendar indexes
CREATE INDEX IF NOT EXISTS idx_school_calendar_school_id ON school_calendar(school_id);

-- Section subjects indexes
CREATE INDEX IF NOT EXISTS idx_section_subjects_school_id ON section_subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_section_subjects_section_id ON section_subjects(section_id);

-- Wings indexes
CREATE INDEX IF NOT EXISTS idx_wings_school_id ON wings(school_id);