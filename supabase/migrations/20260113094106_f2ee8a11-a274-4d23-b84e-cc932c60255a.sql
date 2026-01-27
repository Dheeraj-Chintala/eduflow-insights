-- ============================================
-- STUDENT MODULE EXTENSION MIGRATION
-- ============================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, course, certificate
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all certificates in org"
  ON public.certificates FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE org_id = get_user_org_id(auth.uid())
    ) AND has_permission(auth.uid(), 'certificates.view')
  );

CREATE POLICY "System can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_certificates_course_id ON public.certificates(course_id);

-- 3. DISCUSSION FORUMS TABLE
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  reply_count INTEGER NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topics in enrolled courses"
  ON public.discussion_topics FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    ) OR
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can create topics in enrolled courses"
  ON public.discussion_topics FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own topics"
  ON public.discussion_topics FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own topics"
  ON public.discussion_topics FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_discussion_topics_course_id ON public.discussion_topics(course_id);

-- 4. DISCUSSION REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies in accessible topics"
  ON public.discussion_replies FOR SELECT
  USING (
    topic_id IN (
      SELECT id FROM discussion_topics WHERE course_id IN (
        SELECT course_id FROM enrollments WHERE user_id = auth.uid()
      )
    ) OR
    topic_id IN (
      SELECT id FROM discussion_topics WHERE course_id IN (
        SELECT id FROM courses WHERE instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create replies"
  ON public.discussion_replies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own replies"
  ON public.discussion_replies FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own replies"
  ON public.discussion_replies FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_discussion_replies_topic_id ON public.discussion_replies(topic_id);

-- 5. DOUBTS TABLE
CREATE TABLE IF NOT EXISTS public.doubts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, answered, resolved
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doubts"
  ON public.doubts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view doubts in their courses"
  ON public.doubts FOR SELECT
  USING (
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Mentors can view assigned doubts"
  ON public.doubts FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can create doubts"
  ON public.doubts FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (SELECT course_id FROM enrollments WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own doubts"
  ON public.doubts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can update doubts in their courses"
  ON public.doubts FOR UPDATE
  USING (
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE INDEX idx_doubts_course_id ON public.doubts(course_id);
CREATE INDEX idx_doubts_user_id ON public.doubts(user_id);

-- 6. DOUBT RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.doubt_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doubt_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to accessible doubts"
  ON public.doubt_responses FOR SELECT
  USING (
    doubt_id IN (SELECT id FROM doubts WHERE user_id = auth.uid()) OR
    doubt_id IN (SELECT id FROM doubts WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())) OR
    doubt_id IN (SELECT id FROM doubts WHERE assigned_to = auth.uid())
  );

CREATE POLICY "Users can create responses"
  ON public.doubt_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_doubt_responses_doubt_id ON public.doubt_responses(doubt_id);

-- 7. POLLS TABLE
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view polls in enrolled courses"
  ON public.polls FOR SELECT
  USING (
    course_id IN (SELECT course_id FROM enrollments WHERE user_id = auth.uid()) OR
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Instructors can create polls"
  ON public.polls FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Instructors can update their polls"
  ON public.polls FOR UPDATE
  USING (created_by = auth.uid());

CREATE INDEX idx_polls_course_id ON public.polls(course_id);

-- 8. POLL OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view poll options"
  ON public.poll_options FOR SELECT
  USING (
    poll_id IN (SELECT id FROM polls WHERE course_id IN (SELECT course_id FROM enrollments WHERE user_id = auth.uid())) OR
    poll_id IN (SELECT id FROM polls WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid()))
  );

CREATE POLICY "Instructors can manage poll options"
  ON public.poll_options FOR ALL
  USING (
    poll_id IN (SELECT id FROM polls WHERE created_by = auth.uid())
  );

CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);

-- 9. POLL VOTES TABLE
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes"
  ON public.poll_votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can vote once per poll"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (SELECT id FROM polls WHERE course_id IN (SELECT course_id FROM enrollments WHERE user_id = auth.uid()))
  );

CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);

-- 10. COURSE RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public ratings"
  ON public.course_ratings FOR SELECT
  USING (
    is_public = true OR
    user_id = auth.uid() OR
    course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "Users can rate enrolled courses"
  ON public.course_ratings FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (SELECT course_id FROM enrollments WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own rating"
  ON public.course_ratings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rating"
  ON public.course_ratings FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_course_ratings_course_id ON public.course_ratings(course_id);

-- 11. MENTOR CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mentor_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, closed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.mentor_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their sessions"
  ON public.mentor_chat_sessions FOR SELECT
  USING (student_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "Students can create sessions"
  ON public.mentor_chat_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update sessions"
  ON public.mentor_chat_sessions FOR UPDATE
  USING (student_id = auth.uid() OR mentor_id = auth.uid());

CREATE INDEX idx_mentor_chat_sessions_student ON public.mentor_chat_sessions(student_id);
CREATE INDEX idx_mentor_chat_sessions_mentor ON public.mentor_chat_sessions(mentor_id);

-- 12. MENTOR CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.mentor_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mentor_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.mentor_chat_messages FOR SELECT
  USING (
    session_id IN (SELECT id FROM mentor_chat_sessions WHERE student_id = auth.uid() OR mentor_id = auth.uid())
  );

CREATE POLICY "Participants can send messages"
  ON public.mentor_chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    session_id IN (SELECT id FROM mentor_chat_sessions WHERE student_id = auth.uid() OR mentor_id = auth.uid())
  );

CREATE POLICY "Users can mark their messages as read"
  ON public.mentor_chat_messages FOR UPDATE
  USING (
    session_id IN (SELECT id FROM mentor_chat_sessions WHERE student_id = auth.uid() OR mentor_id = auth.uid())
  );

CREATE INDEX idx_mentor_chat_messages_session ON public.mentor_chat_messages(session_id);

-- 13. Add last_lesson_id to lesson_progress for resume functionality
ALTER TABLE public.lesson_progress 
  ADD COLUMN IF NOT EXISTS last_position INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;

-- 14. Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 15. Add new permissions for student features
INSERT INTO public.permissions (name, description, category) VALUES
  ('forums.view', 'View discussion forums', 'engagement'),
  ('forums.create', 'Create forum topics', 'engagement'),
  ('forums.moderate', 'Moderate forums', 'engagement'),
  ('doubts.view', 'View doubts', 'support'),
  ('doubts.respond', 'Respond to doubts', 'support'),
  ('polls.view', 'View polls', 'engagement'),
  ('polls.create', 'Create polls', 'engagement'),
  ('ratings.view', 'View course ratings', 'courses'),
  ('certificates.view', 'View certificates', 'courses'),
  ('certificates.issue', 'Issue certificates', 'courses'),
  ('mentor_chat.access', 'Access mentor chat', 'support')
ON CONFLICT (name) DO NOTHING;

-- 16. Assign permissions to roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'student', id FROM permissions WHERE name IN (
  'forums.view', 'forums.create', 'doubts.view', 'polls.view', 'ratings.view', 'mentor_chat.access'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'trainer', id FROM permissions WHERE name IN (
  'forums.view', 'forums.create', 'forums.moderate', 'doubts.view', 'doubts.respond', 
  'polls.view', 'polls.create', 'ratings.view', 'certificates.view', 'certificates.issue'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'mentor', id FROM permissions WHERE name IN (
  'forums.view', 'doubts.view', 'doubts.respond', 'mentor_chat.access'
)
ON CONFLICT DO NOTHING;