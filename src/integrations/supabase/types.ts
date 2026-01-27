export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          notes: string | null
          org_id: string | null
          previous_value: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          notes?: string | null
          org_id?: string | null
          previous_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          notes?: string | null
          org_id?: string | null
          previous_value?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chatbot_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          messages: Json
          session_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          session_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          session_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chatbot_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          reasoning: string | null
          recommendation_type: string
          recommended_items: Json
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_type: string
          recommended_items?: Json
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          reasoning?: string | null
          recommendation_type?: string
          recommended_items?: Json
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          display_type: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          is_dismissible: boolean | null
          org_id: string
          priority: string | null
          starts_at: string | null
          target_courses: string[] | null
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          display_type?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          org_id: string
          priority?: string | null
          starts_at?: string | null
          target_courses?: string[] | null
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          display_type?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          is_dismissible?: boolean | null
          org_id?: string
          priority?: string | null
          starts_at?: string | null
          target_courses?: string[] | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_answers: {
        Row: {
          answered_at: string | null
          auto_graded: boolean | null
          created_at: string
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          grader_feedback: string | null
          id: string
          is_correct: boolean | null
          marks_obtained: number | null
          question_id: string
          selected_option_id: string | null
          selected_option_ids: string[] | null
          submission_id: string
          text_answer: string | null
          time_spent_seconds: number | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          auto_graded?: boolean | null
          created_at?: string
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grader_feedback?: string | null
          id?: string
          is_correct?: boolean | null
          marks_obtained?: number | null
          question_id: string
          selected_option_id?: string | null
          selected_option_ids?: string[] | null
          submission_id: string
          text_answer?: string | null
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          auto_graded?: boolean | null
          created_at?: string
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          grader_feedback?: string | null
          id?: string
          is_correct?: boolean | null
          marks_obtained?: number | null
          question_id?: string
          selected_option_id?: string | null
          selected_option_ids?: string[] | null
          submission_id?: string
          text_answer?: string | null
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "assessment_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          allowed_file_types: string[] | null
          assessment_id: string
          auto_gradable: boolean
          case_study_content: string | null
          created_at: string
          explanation: string | null
          grading_rubric: string | null
          id: string
          is_required: boolean
          marks: number
          max_file_size_mb: number | null
          question_media_url: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed_file_types?: string[] | null
          assessment_id: string
          auto_gradable?: boolean
          case_study_content?: string | null
          created_at?: string
          explanation?: string | null
          grading_rubric?: string | null
          id?: string
          is_required?: boolean
          marks?: number
          max_file_size_mb?: number | null
          question_media_url?: string | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allowed_file_types?: string[] | null
          assessment_id?: string
          auto_gradable?: boolean
          case_study_content?: string | null
          created_at?: string
          explanation?: string | null
          grading_rubric?: string | null
          id?: string
          is_required?: boolean
          marks?: number
          max_file_size_mb?: number | null
          question_media_url?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_submissions: {
        Row: {
          assessment_id: string
          attempt_number: number
          auto_graded_at: string | null
          created_at: string
          graded_by: string | null
          grader_comments: string | null
          id: string
          manually_graded_at: string | null
          passed: boolean | null
          percentage: number | null
          question_order: string[] | null
          started_at: string
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          time_spent_seconds: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          attempt_number?: number
          auto_graded_at?: string | null
          created_at?: string
          graded_by?: string | null
          grader_comments?: string | null
          id?: string
          manually_graded_at?: string | null
          passed?: boolean | null
          percentage?: number | null
          question_order?: string[] | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          attempt_number?: number
          auto_graded_at?: string | null
          created_at?: string
          graded_by?: string | null
          grader_comments?: string | null
          id?: string
          manually_graded_at?: string | null
          passed?: boolean | null
          percentage?: number | null
          question_order?: string[] | null
          started_at?: string
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          allow_resume: boolean
          assessment_type: string
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          instructions: string | null
          lesson_id: string | null
          max_attempts: number
          module_id: string | null
          negative_mark_value: number | null
          negative_marking: boolean
          passing_marks: number
          questions_per_attempt: number | null
          randomize_options: boolean
          randomize_questions: boolean
          retake_delay_hours: number | null
          show_correct_answers: boolean
          show_score_immediately: boolean
          start_time: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          allow_resume?: boolean
          assessment_type?: string
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_attempts?: number
          module_id?: string | null
          negative_mark_value?: number | null
          negative_marking?: boolean
          passing_marks?: number
          questions_per_attempt?: number | null
          randomize_options?: boolean
          randomize_questions?: boolean
          retake_delay_hours?: number | null
          show_correct_answers?: boolean
          show_score_immediately?: boolean
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          allow_resume?: boolean
          assessment_type?: string
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          instructions?: string | null
          lesson_id?: string | null
          max_attempts?: number
          module_id?: string | null
          negative_mark_value?: number | null
          negative_marking?: boolean
          passing_marks?: number
          questions_per_attempt?: number | null
          randomize_options?: boolean
          randomize_questions?: boolean
          retake_delay_hours?: number | null
          show_correct_answers?: boolean
          show_score_immediately?: boolean
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_url: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          marks_obtained: number | null
          status: string
          submission_number: number | null
          submission_text: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          attachment_url?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          marks_obtained?: number | null
          status?: string
          submission_number?: number | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          attachment_url?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          marks_obtained?: number | null
          status?: string
          submission_number?: number | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean | null
          allow_resubmission: boolean | null
          attachment_url: string | null
          batch_id: string | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          instructor_id: string
          late_penalty_percent: number | null
          max_marks: number | null
          max_resubmissions: number | null
          module_id: string | null
          passing_marks: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_late_submission?: boolean | null
          allow_resubmission?: boolean | null
          attachment_url?: string | null
          batch_id?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          instructor_id: string
          late_penalty_percent?: number | null
          max_marks?: number | null
          max_resubmissions?: number | null
          module_id?: string | null
          passing_marks?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_late_submission?: boolean | null
          allow_resubmission?: boolean | null
          attachment_url?: string | null
          batch_id?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          instructor_id?: string
          late_penalty_percent?: number | null
          max_marks?: number | null
          max_resubmissions?: number | null
          module_id?: string | null
          passing_marks?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_type: string
          created_at: string
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number | null
        }
        Insert: {
          badge_type?: string
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required?: number | null
        }
        Update: {
          badge_type?: string
          created_at?: string
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      bundle_courses: {
        Row: {
          bundle_id: string
          course_id: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_courses_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_purchases: {
        Row: {
          amount_paid: number | null
          bundle_id: string
          expires_at: string | null
          id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          bundle_id: string
          expires_at?: string | null
          id?: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          bundle_id?: string
          expires_at?: string | null
          id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_purchases_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          current_step: number | null
          enrolled_at: string
          id: string
          metadata: Json | null
          next_step_scheduled_at: string | null
          status: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          metadata?: Json | null
          next_step_scheduled_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          id?: string
          metadata?: Json | null
          next_step_scheduled_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          created_at: string
          created_by: string
          css_styles: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_position: string | null
          name: string
          org_id: string
          signature_position: string | null
          template_html: string
          updated_at: string
        }
        Insert: {
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          created_at?: string
          created_by: string
          css_styles?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_position?: string | null
          name: string
          org_id: string
          signature_position?: string | null
          template_html: string
          updated_at?: string
        }
        Update: {
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          created_at?: string
          created_by?: string
          css_styles?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_position?: string | null
          name?: string
          org_id?: string
          signature_position?: string | null
          template_html?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_verification_logs: {
        Row: {
          certificate_id: string | null
          id: string
          lor_id: string | null
          verification_method: string
          verification_result: string
          verified_at: string
          verifier_ip: string | null
          verifier_user_agent: string | null
        }
        Insert: {
          certificate_id?: string | null
          id?: string
          lor_id?: string | null
          verification_method: string
          verification_result: string
          verified_at?: string
          verifier_ip?: string | null
          verifier_user_agent?: string | null
        }
        Update: {
          certificate_id?: string | null
          id?: string
          lor_id?: string | null
          verification_method?: string
          verification_result?: string
          verified_at?: string
          verifier_ip?: string | null
          verifier_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_verification_logs_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_verification_logs_lor_id_fkey"
            columns: ["lor_id"]
            isOneToOne: false
            referencedRelation: "letters_of_recommendation"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          additional_data: Json | null
          authorized_signature_url: string | null
          certificate_number: string
          certificate_type:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          course_duration: string | null
          course_id: string
          created_at: string
          end_date: string | null
          enrollment_id: string | null
          expires_at: string | null
          id: string
          is_revoked: boolean | null
          issued_at: string
          issued_by: string | null
          pdf_url: string | null
          qr_code_data: string | null
          recipient_email: string | null
          recipient_name: string | null
          revoked_at: string | null
          revoked_reason: string | null
          start_date: string | null
          template_id: string | null
          user_id: string
          verification_url: string | null
        }
        Insert: {
          additional_data?: Json | null
          authorized_signature_url?: string | null
          certificate_number: string
          certificate_type?:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          course_duration?: string | null
          course_id: string
          created_at?: string
          end_date?: string | null
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean | null
          issued_at?: string
          issued_by?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          start_date?: string | null
          template_id?: string | null
          user_id: string
          verification_url?: string | null
        }
        Update: {
          additional_data?: Json | null
          authorized_signature_url?: string | null
          certificate_number?: string
          certificate_type?:
            | Database["public"]["Enums"]["certificate_type"]
            | null
          course_duration?: string | null
          course_id?: string
          created_at?: string
          end_date?: string | null
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          is_revoked?: boolean | null
          issued_at?: string
          issued_by?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          start_date?: string | null
          template_id?: string | null
          user_id?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_payouts: {
        Row: {
          created_at: string
          currency: string | null
          deductions: number | null
          franchise_id: string
          id: string
          net_payout: number | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payout_period_end: string
          payout_period_start: string
          processed_by: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          total_commission: number | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          deductions?: number | null
          franchise_id: string
          id?: string
          net_payout?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payout_period_end: string
          payout_period_start: string
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          deductions?: number | null
          franchise_id?: string
          id?: string
          net_payout?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payout_period_end?: string
          payout_period_start?: string
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          total_commission?: number | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_payouts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          bonus_amount: number | null
          bonus_threshold: number | null
          commission_type: string | null
          commission_value: number
          course_id: string | null
          created_at: string
          franchise_id: string | null
          franchise_type: Database["public"]["Enums"]["franchise_type"] | null
          id: string
          is_active: boolean | null
          min_sale_amount: number | null
          org_id: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          bonus_amount?: number | null
          bonus_threshold?: number | null
          commission_type?: string | null
          commission_value?: number
          course_id?: string | null
          created_at?: string
          franchise_id?: string | null
          franchise_type?: Database["public"]["Enums"]["franchise_type"] | null
          id?: string
          is_active?: boolean | null
          min_sale_amount?: number | null
          org_id: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          bonus_amount?: number | null
          bonus_threshold?: number | null
          commission_type?: string | null
          commission_value?: number
          course_id?: string | null
          created_at?: string
          franchise_id?: string | null
          franchise_type?: Database["public"]["Enums"]["franchise_type"] | null
          id?: string
          is_active?: boolean | null
          min_sale_amount?: number | null
          org_id?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_access_logs: {
        Row: {
          access_type: string
          content_id: string
          content_type: string
          course_id: string | null
          created_at: string
          device_fingerprint: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          lesson_id: string | null
          user_id: string
          watermark_applied: boolean | null
        }
        Insert: {
          access_type: string
          content_id: string
          content_type: string
          course_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          lesson_id?: string | null
          user_id: string
          watermark_applied?: boolean | null
        }
        Update: {
          access_type?: string
          content_id?: string
          content_type?: string
          course_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          lesson_id?: string | null
          user_id?: string
          watermark_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "content_access_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_access_logs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      content_moderation_queue: {
        Row: {
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string
          flagged_reason: string | null
          id: string
          moderation_notes: string | null
          moderator_id: string | null
          org_id: string | null
          priority: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          submitted_at: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_title?: string | null
          content_type: string
          created_at?: string
          flagged_reason?: string | null
          id?: string
          moderation_notes?: string | null
          moderator_id?: string | null
          org_id?: string | null
          priority?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_at?: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string
          flagged_reason?: string | null
          id?: string
          moderation_notes?: string | null
          moderator_id?: string | null
          org_id?: string | null
          priority?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          submitted_at?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_preferences: {
        Row: {
          analytics: boolean
          created_at: string
          essential: boolean
          functional: boolean
          id: string
          ip_address: string | null
          marketing: boolean
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          analytics?: boolean
          created_at?: string
          essential?: boolean
          functional?: boolean
          id?: string
          ip_address?: string | null
          marketing?: boolean
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          analytics?: boolean
          created_at?: string
          essential?: boolean
          functional?: boolean
          id?: string
          ip_address?: string | null
          marketing?: boolean
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      corporate_training_enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string
          id: string
          program_id: string
          progress: number | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          program_id: string
          progress?: number | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string
          id?: string
          program_id?: string
          progress?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_training_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "corporate_training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_training_programs: {
        Row: {
          course_ids: string[] | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          mandatory: boolean | null
          name: string
          org_id: string
          status: string
          target_departments: string[] | null
          updated_at: string
        }
        Insert: {
          course_ids?: string[] | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          mandatory?: boolean | null
          name: string
          org_id: string
          status?: string
          target_departments?: string[] | null
          updated_at?: string
        }
        Update: {
          course_ids?: string[] | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          mandatory?: boolean | null
          name?: string
          org_id?: string
          status?: string
          target_departments?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_training_programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_courses: string[] | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string | null
          discount_value: number
          franchise_id: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          org_id: string
          per_user_limit: number | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_courses?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          org_id: string
          per_user_limit?: number | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_courses?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          org_id?: string
          per_user_limit?: number | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access_rules: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          priority: number | null
          rule_type: string
          rule_value: Json
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          priority?: number | null
          rule_type: string
          rule_value: Json
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          priority?: number | null
          rule_type?: string
          rule_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_rules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_batches: {
        Row: {
          batch_code: string | null
          course_end: string | null
          course_id: string
          course_start: string
          created_at: string
          description: string | null
          enrollment_end: string
          enrollment_start: string
          id: string
          max_students: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          batch_code?: string | null
          course_end?: string | null
          course_id: string
          course_start: string
          created_at?: string
          description?: string | null
          enrollment_end: string
          enrollment_start: string
          id?: string
          max_students?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          batch_code?: string | null
          course_end?: string | null
          course_id?: string
          course_start?: string
          created_at?: string
          description?: string | null
          enrollment_end?: string
          enrollment_start?: string
          id?: string
          max_students?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundles: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean
          org_id: string
          price: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          org_id: string
          price?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          org_id?: string
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_bundles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prerequisites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          prerequisite_course_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          prerequisite_course_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          prerequisite_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_public: boolean
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_days: number | null
          category: string | null
          course_type: string
          created_at: string
          currency: string | null
          description: string | null
          difficulty: string | null
          duration: string | null
          enrollment_type: string | null
          estimated_hours: number | null
          id: string
          instructor_id: string
          is_featured: boolean | null
          max_students: number | null
          org_id: string
          price: number | null
          published_at: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_days?: number | null
          category?: string | null
          course_type?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          enrollment_type?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id: string
          is_featured?: boolean | null
          max_students?: number | null
          org_id: string
          price?: number | null
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_days?: number | null
          category?: string | null
          course_type?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty?: string | null
          duration?: string | null
          enrollment_type?: string | null
          estimated_hours?: number | null
          id?: string
          instructor_id?: string
          is_featured?: boolean | null
          max_students?: number | null
          org_id?: string
          price?: number | null
          published_at?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_role_permissions: {
        Row: {
          created_at: string
          custom_role_id: string
          id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id: string
          id?: string
          permission_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_role_permissions_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_restrictions: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          device_fingerprint: string
          device_name: string | null
          first_seen_at: string | null
          id: string
          is_blocked: boolean | null
          is_trusted: boolean | null
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          device_fingerprint: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          is_blocked?: boolean | null
          is_trusted?: boolean | null
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          device_fingerprint?: string
          device_name?: string | null
          first_seen_at?: string | null
          id?: string
          is_blocked?: boolean | null
          is_trusted?: boolean | null
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_solution: boolean
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "discussion_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_topics: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          reply_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_responses: {
        Row: {
          content: string
          created_at: string
          doubt_id: string
          id: string
          is_solution: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          doubt_id: string
          id?: string
          is_solution?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          doubt_id?: string
          id?: string
          is_solution?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_responses_doubt_id_fkey"
            columns: ["doubt_id"]
            isOneToOne: false
            referencedRelation: "doubts"
            referencedColumns: ["id"]
          },
        ]
      }
      doubts: {
        Row: {
          assigned_to: string | null
          course_id: string
          created_at: string
          description: string
          id: string
          lesson_id: string | null
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          course_id: string
          created_at?: string
          description: string
          id?: string
          lesson_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          lesson_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_campaign_steps: {
        Row: {
          body: string | null
          campaign_id: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delay_days: number | null
          delay_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          skip_conditions: Json | null
          step_number: number
          subject: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          campaign_id: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          skip_conditions?: Json | null
          step_number: number
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          campaign_id?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          skip_conditions?: Json | null
          step_number?: number
          subject?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_campaign_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: string
          name: string
          org_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          target_courses: string[] | null
          target_roles: string[] | null
          total_completed: number | null
          total_enrolled: number | null
          trigger_conditions: Json | null
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name: string
          org_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_courses?: string[] | null
          target_roles?: string[] | null
          total_completed?: number | null
          total_enrolled?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          org_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          target_courses?: string[] | null
          target_roles?: string[] | null
          total_completed?: number | null
          total_enrolled?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          paid_at: string | null
          payment_id: string | null
          status: Database["public"]["Enums"]["emi_status"] | null
          updated_at: string
          user_emi_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          paid_at?: string | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["emi_status"] | null
          updated_at?: string
          user_emi_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          paid_at?: string | null
          payment_id?: string | null
          status?: Database["public"]["Enums"]["emi_status"] | null
          updated_at?: string
          user_emi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_installments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emi_installments_user_emi_id_fkey"
            columns: ["user_emi_id"]
            isOneToOne: false
            referencedRelation: "user_emi"
            referencedColumns: ["id"]
          },
        ]
      }
      emi_plans: {
        Row: {
          applicable_bundles: string[] | null
          applicable_courses: string[] | null
          created_at: string
          description: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          name: string
          org_id: string
          processing_fee: number | null
          tenure_months: number
          updated_at: string
        }
        Insert: {
          applicable_bundles?: string[] | null
          applicable_courses?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          name: string
          org_id: string
          processing_fee?: number | null
          tenure_months: number
          updated_at?: string
        }
        Update: {
          applicable_bundles?: string[] | null
          applicable_courses?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          name?: string
          org_id?: string
          processing_fee?: number | null
          tenure_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          company_description: string | null
          company_logo_url: string | null
          company_name: string
          company_size: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          industry: string | null
          is_verified: boolean | null
          location: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          location?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_size?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          location?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          access_revoked: boolean | null
          batch_id: string | null
          completed_at: string | null
          course_id: string
          enrolled_at: string
          expires_at: string | null
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          access_revoked?: boolean | null
          batch_id?: string | null
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          access_revoked?: boolean | null
          batch_id?: string | null
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_branding: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_domain: string | null
          favicon_url: string | null
          footer_text: string | null
          franchise_id: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          franchise_id: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          franchise_id?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_branding_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: true
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          converted_user_id: string | null
          course_interest: string | null
          created_at: string
          email: string | null
          follow_up_date: string | null
          franchise_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_user_id?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          franchise_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_user_id?: string | null
          course_interest?: string | null
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          franchise_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_leads_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_sales: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          coupon_code: string | null
          course_id: string | null
          created_at: string
          currency: string | null
          enrollment_id: string | null
          franchise_id: string
          id: string
          notes: string | null
          payment_status: string | null
          referral_code: string | null
          sale_amount: number
          sale_date: string
          student_user_id: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          coupon_code?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string | null
          enrollment_id?: string | null
          franchise_id: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          referral_code?: string | null
          sale_amount?: number
          sale_date?: string
          student_user_id: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          coupon_code?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string | null
          enrollment_id?: string | null
          franchise_id?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          referral_code?: string | null
          sale_amount?: number
          sale_date?: string
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_sales_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_sales_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_sales_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_students: {
        Row: {
          created_at: string
          enrolled_at: string
          franchise_id: string
          id: string
          notes: string | null
          referred_by_code: string | null
          student_user_id: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          franchise_id: string
          id?: string
          notes?: string | null
          referred_by_code?: string | null
          student_user_id: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          franchise_id?: string
          id?: string
          notes?: string | null
          referred_by_code?: string | null
          student_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_students_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchises: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          business_name: string
          city: string | null
          country: string | null
          created_at: string
          email: string
          franchise_code: string
          franchise_type: Database["public"]["Enums"]["franchise_type"]
          gst_number: string | null
          id: string
          notes: string | null
          org_id: string
          owner_name: string
          pan_number: string | null
          parent_franchise_id: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          status: Database["public"]["Enums"]["franchise_status"] | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name: string
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          franchise_code: string
          franchise_type?: Database["public"]["Enums"]["franchise_type"]
          gst_number?: string | null
          id?: string
          notes?: string | null
          org_id: string
          owner_name: string
          pan_number?: string | null
          parent_franchise_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["franchise_status"] | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          franchise_code?: string
          franchise_type?: Database["public"]["Enums"]["franchise_type"]
          gst_number?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          owner_name?: string
          pan_number?: string | null
          parent_franchise_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["franchise_status"] | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchises_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchises_parent_franchise_id_fkey"
            columns: ["parent_franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_data_requests: {
        Row: {
          created_at: string
          data_export_url: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_export_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_export_url?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instructor_revenue: {
        Row: {
          course_id: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          instructor_amount: number
          instructor_id: string
          instructor_share_percent: number | null
          payout_date: string | null
          platform_amount: number
          status: string
          total_amount: number
          transaction_ref: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          instructor_amount?: number
          instructor_id: string
          instructor_share_percent?: number | null
          payout_date?: string | null
          platform_amount?: number
          status?: string
          total_amount?: number
          transaction_ref?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          instructor_amount?: number
          instructor_id?: string
          instructor_share_percent?: number | null
          payout_date?: string | null
          platform_amount?: number
          status?: string
          total_amount?: number
          transaction_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_revenue_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_revenue_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_settings: {
        Row: {
          can_issue_certificates: boolean | null
          can_schedule_live_classes: boolean | null
          created_at: string
          id: string
          instructor_id: string
          max_courses: number | null
          revenue_share_percent: number | null
          show_revenue: boolean | null
          updated_at: string
        }
        Insert: {
          can_issue_certificates?: boolean | null
          can_schedule_live_classes?: boolean | null
          created_at?: string
          id?: string
          instructor_id: string
          max_courses?: number | null
          revenue_share_percent?: number | null
          show_revenue?: boolean | null
          updated_at?: string
        }
        Update: {
          can_issue_certificates?: boolean | null
          can_schedule_live_classes?: boolean | null
          created_at?: string
          id?: string
          instructor_id?: string
          max_courses?: number | null
          revenue_share_percent?: number | null
          show_revenue?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          internship_id: string
          portfolio_url: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status:
            | Database["public"]["Enums"]["internship_application_status"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id: string
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?:
            | Database["public"]["Enums"]["internship_application_status"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id?: string
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?:
            | Database["public"]["Enums"]["internship_application_status"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_enrollments: {
        Row: {
          actual_end_date: string | null
          application_id: string | null
          completed_at: string | null
          enrolled_at: string
          expected_end_date: string | null
          id: string
          internship_id: string
          is_completed: boolean | null
          progress: number | null
          start_date: string
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          application_id?: string | null
          completed_at?: string | null
          enrolled_at?: string
          expected_end_date?: string | null
          id?: string
          internship_id: string
          is_completed?: boolean | null
          progress?: number | null
          start_date: string
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          application_id?: string | null
          completed_at?: string | null
          enrolled_at?: string
          expected_end_date?: string | null
          id?: string
          internship_id?: string
          is_completed?: boolean | null
          progress?: number | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_enrollments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_enrollments_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_offer_letters: {
        Row: {
          application_id: string
          content: string
          created_at: string
          end_date: string | null
          expires_at: string | null
          id: string
          internship_id: string
          issued_by: string
          offer_number: string
          pdf_url: string | null
          responded_at: string | null
          sent_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["offer_letter_status"] | null
          stipend_amount: number | null
          terms_and_conditions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          end_date?: string | null
          expires_at?: string | null
          id?: string
          internship_id: string
          issued_by: string
          offer_number: string
          pdf_url?: string | null
          responded_at?: string | null
          sent_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["offer_letter_status"] | null
          stipend_amount?: number | null
          terms_and_conditions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          end_date?: string | null
          expires_at?: string | null
          id?: string
          internship_id?: string
          issued_by?: string
          offer_number?: string
          pdf_url?: string | null
          responded_at?: string | null
          sent_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["offer_letter_status"] | null
          stipend_amount?: number | null
          terms_and_conditions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_offer_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_offer_letters_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_task_submissions: {
        Row: {
          attachment_url: string | null
          enrollment_id: string
          graded_at: string | null
          graded_by: string | null
          id: string
          marks_obtained: number | null
          mentor_feedback: string | null
          status: Database["public"]["Enums"]["internship_task_status"] | null
          submission_text: string | null
          submitted_at: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          enrollment_id: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          mentor_feedback?: string | null
          status?: Database["public"]["Enums"]["internship_task_status"] | null
          submission_text?: string | null
          submitted_at?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          enrollment_id?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          mentor_feedback?: string | null
          status?: Database["public"]["Enums"]["internship_task_status"] | null
          submission_text?: string | null
          submitted_at?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_task_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "internship_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "internship_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_tasks: {
        Row: {
          attachment_url: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          internship_id: string
          is_mandatory: boolean | null
          max_marks: number | null
          passing_marks: number | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          internship_id: string
          is_mandatory?: boolean | null
          max_marks?: number | null
          passing_marks?: number | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          internship_id?: string
          is_mandatory?: boolean | null
          max_marks?: number | null
          passing_marks?: number | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_tasks_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          application_deadline: string | null
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          duration_weeks: number | null
          eligibility: string | null
          end_date: string | null
          id: string
          is_remote: boolean | null
          location: string | null
          max_positions: number | null
          mentor_id: string | null
          org_id: string
          responsibilities: string | null
          skills_required: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["internship_status"] | null
          stipend_amount: number | null
          stipend_currency: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          duration_weeks?: number | null
          eligibility?: string | null
          end_date?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_positions?: number | null
          mentor_id?: string | null
          org_id: string
          responsibilities?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          stipend_amount?: number | null
          stipend_currency?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          duration_weeks?: number | null
          eligibility?: string | null
          end_date?: string | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_positions?: number | null
          mentor_id?: string | null
          org_id?: string
          responsibilities?: string | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["internship_status"] | null
          stipend_amount?: number | null
          stipend_currency?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_type: string | null
          interviewer_name: string | null
          job_id: string
          location: string | null
          meeting_url: string | null
          notes: string | null
          rating: number | null
          scheduled_at: string
          status: Database["public"]["Enums"]["interview_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_name?: string | null
          job_id: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["interview_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_type?: string | null
          interviewer_name?: string | null
          job_id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["interview_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_gstin: string | null
          billing_name: string | null
          billing_phone: string | null
          billing_pincode: string | null
          billing_state: string | null
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string
          discount_amount: number | null
          due_date: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_number: string
          issued_at: string | null
          line_items: Json | null
          notes: string | null
          org_id: string
          paid_at: string | null
          payment_id: string | null
          pdf_url: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          taxable_amount: number
          total_amount: number
          total_tax: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_gstin?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number: string
          issued_at?: string | null
          line_items?: Json | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          taxable_amount: number
          total_amount: number
          total_tax?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_gstin?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          payment_id?: string | null
          pdf_url?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          taxable_amount?: number
          total_amount?: number
          total_tax?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_restrictions: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: string
          ip_range_end: string | null
          ip_range_start: string | null
          org_id: string | null
          reason: string | null
          restriction_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          ip_range_end?: string | null
          ip_range_start?: string | null
          org_id?: string | null
          reason?: string | null
          restriction_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          ip_range_end?: string | null
          ip_range_start?: string | null
          org_id?: string | null
          reason?: string | null
          restriction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_restrictions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          employer_notes: string | null
          id: string
          job_id: string
          resume_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["job_application_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          employer_notes?: string | null
          id?: string
          job_id: string
          resume_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["job_application_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          employer_notes?: string | null
          id?: string
          job_id?: string
          resume_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["job_application_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "student_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          created_at: string
          description: string | null
          eligibility_criteria: string | null
          employer_id: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          experience_max_years: number | null
          experience_min_years: number | null
          id: string
          is_remote: boolean | null
          location: string | null
          max_applications: number | null
          org_id: string
          posted_at: string | null
          requirements: string | null
          responsibilities: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          employer_id: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          experience_max_years?: number | null
          experience_min_years?: number | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_applications?: number | null
          org_id: string
          posted_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          created_at?: string
          description?: string | null
          eligibility_criteria?: string | null
          employer_id?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          experience_max_years?: number | null
          experience_min_years?: number | null
          id?: string
          is_remote?: boolean | null
          location?: string | null
          max_applications?: number | null
          org_id?: string
          posted_at?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_cache: {
        Row: {
          id: string
          org_id: string | null
          period: string
          points: number
          rank: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          period?: string
          points: number
          rank: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          org_id?: string | null
          period?: string
          points?: number
          rank?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          document_type: string
          effective_date: string
          id: string
          is_active: boolean | null
          org_id: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          document_type: string
          effective_date?: string
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          document_type?: string
          effective_date?: string
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          last_position: number | null
          lesson_id: string
          time_spent: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position?: number | null
          lesson_id: string
          time_spent?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          last_position?: number | null
          lesson_id?: string
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          duration: number | null
          id: string
          module_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      letters_of_recommendation: {
        Row: {
          achievements: string[] | null
          certificate_id: string | null
          content: string
          course_id: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_public: boolean | null
          issued_at: string
          lor_number: string
          pdf_url: string | null
          performance_rating: number | null
          recipient_email: string | null
          recipient_name: string
          recommendation_type: string
          recommender_name: string
          recommender_signature_url: string | null
          recommender_title: string | null
          skills_highlighted: string[] | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          certificate_id?: string | null
          content: string
          course_id?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          issued_at?: string
          lor_number: string
          pdf_url?: string | null
          performance_rating?: number | null
          recipient_email?: string | null
          recipient_name: string
          recommendation_type?: string
          recommender_name: string
          recommender_signature_url?: string | null
          recommender_title?: string | null
          skills_highlighted?: string[] | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          certificate_id?: string | null
          content?: string
          course_id?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          issued_at?: string
          lor_number?: string
          pdf_url?: string | null
          performance_rating?: number | null
          recipient_email?: string | null
          recipient_name?: string
          recommendation_type?: string
          recommender_name?: string
          recommender_signature_url?: string | null
          recommender_title?: string | null
          skills_highlighted?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_of_recommendation_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_of_recommendation_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_class_attendance: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          live_class_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          live_class_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          live_class_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_class_attendance_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          batch_id: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string
          max_attendees: number | null
          meeting_platform: string | null
          meeting_url: string | null
          notify_students: boolean | null
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id: string
          max_attendees?: number | null
          meeting_platform?: string | null
          meeting_url?: string | null
          notify_students?: boolean | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string
          max_attendees?: number | null
          meeting_platform?: string | null
          meeting_url?: string | null
          notify_students?: boolean | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentor_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_chat_sessions: {
        Row: {
          closed_at: string | null
          course_id: string | null
          created_at: string
          id: string
          mentor_id: string
          status: string
          student_id: string
        }
        Insert: {
          closed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          status?: string
          student_id: string
        }
        Update: {
          closed_at?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_chat_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          body: string
          campaign_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          org_id: string
          provider: string | null
          provider_message_id: string | null
          provider_response: Json | null
          read_at: string | null
          recipient: string
          reminder_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          org_id: string
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          read_at?: string | null
          recipient: string
          reminder_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          org_id?: string
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          read_at?: string | null
          recipient?: string
          reminder_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interviews: {
        Row: {
          ai_feedback: Json | null
          completed_at: string | null
          created_at: string
          difficulty: string
          id: string
          interview_type: string
          job_role: string
          overall_score: number | null
          questions: Json
          responses: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          interview_type?: string
          job_role: string
          overall_score?: number | null
          questions?: Json
          responses?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          interview_type?: string
          job_role?: string
          overall_score?: number | null
          questions?: Json
          responses?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          category_preferences: Json | null
          created_at: string
          email_digest_enabled: boolean | null
          email_digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          category_preferences?: Json | null
          created_at?: string
          email_digest_enabled?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          category_preferences?: Json | null
          created_at?: string
          email_digest_enabled?: boolean | null
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          available_variables: string[] | null
          body: string
          category: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          created_by: string | null
          description: string | null
          event_trigger: string | null
          html_body: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          org_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          available_variables?: string[] | null
          body: string
          category?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_trigger?: string | null
          html_body?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          org_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          available_variables?: string[] | null
          body?: string
          category?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_trigger?: string | null
          html_body?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          org_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      org_feature_settings: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          org_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          org_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          org_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_feature_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          config: Json | null
          created_at: string
          gateway_name: string
          gateway_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          org_id: string
          supported_currencies: string[] | null
          transaction_fee_percent: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          gateway_name: string
          gateway_type: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          org_id: string
          supported_currencies?: string[] | null
          transaction_fee_percent?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          gateway_name?: string
          gateway_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          org_id?: string
          supported_currencies?: string[] | null
          transaction_fee_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          bundle_id: string | null
          commission_amount: number | null
          completed_at: string | null
          coupon_id: string | null
          course_id: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          franchise_id: string | null
          gateway_id: string | null
          gateway_order_id: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          ip_address: string | null
          notes: string | null
          org_id: string
          payment_method: string | null
          purchase_type: string
          referral_code: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bundle_id?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          coupon_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          franchise_id?: string | null
          gateway_id?: string | null
          gateway_order_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          org_id: string
          payment_method?: string | null
          purchase_type: string
          referral_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bundle_id?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          coupon_id?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          franchise_id?: string | null
          gateway_id?: string | null
          gateway_order_id?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          org_id?: string
          payment_method?: string | null
          purchase_type?: string
          referral_code?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          accepted_at: string | null
          application_id: string
          created_at: string
          employer_id: string
          id: string
          job_id: string
          joined_at: string | null
          joining_date: string | null
          offer_letter_url: string | null
          offered_salary: number | null
          remarks: string | null
          salary_currency: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          joined_at?: string | null
          joining_date?: string | null
          offer_letter_url?: string | null
          offered_salary?: number | null
          remarks?: string | null
          salary_currency?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          joined_at?: string | null
          joining_date?: string | null
          offer_letter_url?: string | null
          offered_salary?: number | null
          remarks?: string | null
          salary_currency?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          option_text: string
          poll_id: string
          sort_order: number
          vote_count: number
        }
        Insert: {
          id?: string
          option_text: string
          poll_id: string
          sort_order?: number
          vote_count?: number
        }
        Update: {
          id?: string
          option_text?: string
          poll_id?: string
          sort_order?: number
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          applies_to: string
          conditions: Json | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number | null
          org_id: string
          priority: number | null
          rule_name: string
          rule_type: string
          start_date: string | null
          target_id: string | null
          updated_at: string
          value: number
          value_type: string
        }
        Insert: {
          applies_to: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          org_id: string
          priority?: number | null
          rule_name: string
          rule_type: string
          start_date?: string | null
          target_id?: string | null
          updated_at?: string
          value: number
          value_type: string
        }
        Update: {
          applies_to?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number | null
          org_id?: string
          priority?: number | null
          rule_name?: string
          rule_type?: string
          start_date?: string | null
          target_id?: string | null
          updated_at?: string
          value?: number
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank: {
        Row: {
          category: string | null
          course_id: string | null
          created_at: string
          created_by: string
          difficulty: string | null
          explanation: string | null
          id: string
          org_id: string
          question_media_url: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          course_id?: string | null
          created_at?: string
          created_by: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          org_id: string
          question_media_url?: string | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          org_id?: string
          question_media_url?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_bank_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      question_bank_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_media_url: string | null
          option_text: string
          question_bank_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_media_url?: string | null
          option_text: string
          question_bank_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_media_url?: string | null
          option_text?: string
          question_bank_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_options_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_media_url: string | null
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_media_url?: string | null
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_media_url?: string | null
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          commission_bonus: number | null
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number | null
          franchise_id: string
          id: string
          is_active: boolean | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          commission_bonus?: number | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          franchise_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          commission_bonus?: number | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          franchise_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          gateway_refund_id: string | null
          id: string
          org_id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          refund_method: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["refund_status"] | null
          updated_at: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          gateway_refund_id?: string | null
          id?: string
          org_id: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          refund_method?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"] | null
          updated_at?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          gateway_refund_id?: string | null
          id?: string
          org_id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          refund_method?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"] | null
          updated_at?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_ats_scores: {
        Row: {
          ai_analysis: string | null
          ats_score: number | null
          created_at: string
          format_issues: Json | null
          id: string
          improvement_suggestions: Json | null
          job_description: string | null
          keyword_matches: Json | null
          missing_keywords: Json | null
          resume_id: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ats_score?: number | null
          created_at?: string
          format_issues?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          job_description?: string | null
          keyword_matches?: Json | null
          missing_keywords?: Json | null
          resume_id?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ats_score?: number | null
          created_at?: string
          format_issues?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          job_description?: string | null
          keyword_matches?: Json | null
          missing_keywords?: Json | null
          resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_ats_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "student_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reminders: {
        Row: {
          channels: Database["public"]["Enums"]["notification_channel"][] | null
          created_at: string
          id: string
          is_recurring: boolean | null
          message: string
          org_id: string
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          related_id: string | null
          related_type: string | null
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          scheduled_for: string
          sent_at: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          message: string
          org_id: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          related_id?: string | null
          related_type?: string | null
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          created_at?: string
          id?: string
          is_recurring?: boolean | null
          message?: string
          org_id?: string
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          related_id?: string | null
          related_type?: string | null
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          created_at: string
          description: string | null
          device_fingerprint: string | null
          event_category: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          device_fingerprint?: string | null
          event_category: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          device_fingerprint?: string | null
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          download_restriction_roles: string[] | null
          enable_2fa: boolean | null
          enable_device_restriction: boolean | null
          enable_ip_restriction: boolean | null
          enable_right_click_prevention: boolean | null
          enable_screen_capture_prevention: boolean | null
          enable_watermark: boolean | null
          id: string
          max_concurrent_sessions: number | null
          max_devices_per_user: number | null
          org_id: string | null
          require_2fa_for_roles: string[] | null
          session_timeout_minutes: number | null
          updated_at: string
          video_protection_level: string | null
          watermark_text_template: string | null
        }
        Insert: {
          created_at?: string
          download_restriction_roles?: string[] | null
          enable_2fa?: boolean | null
          enable_device_restriction?: boolean | null
          enable_ip_restriction?: boolean | null
          enable_right_click_prevention?: boolean | null
          enable_screen_capture_prevention?: boolean | null
          enable_watermark?: boolean | null
          id?: string
          max_concurrent_sessions?: number | null
          max_devices_per_user?: number | null
          org_id?: string | null
          require_2fa_for_roles?: string[] | null
          session_timeout_minutes?: number | null
          updated_at?: string
          video_protection_level?: string | null
          watermark_text_template?: string | null
        }
        Update: {
          created_at?: string
          download_restriction_roles?: string[] | null
          enable_2fa?: boolean | null
          enable_device_restriction?: boolean | null
          enable_ip_restriction?: boolean | null
          enable_right_click_prevention?: boolean | null
          enable_screen_capture_prevention?: boolean | null
          enable_watermark?: boolean | null
          id?: string
          max_concurrent_sessions?: number | null
          max_devices_per_user?: number | null
          org_id?: string | null
          require_2fa_for_roles?: string[] | null
          session_timeout_minutes?: number | null
          updated_at?: string
          video_protection_level?: string | null
          watermark_text_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          ai_analysis: string | null
          assessed_skills: Json
          created_at: string
          id: string
          recommendations: Json | null
          skill_gaps: Json | null
          target_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          assessed_skills?: Json
          created_at?: string
          id?: string
          recommendations?: Json | null
          skill_gaps?: Json | null
          target_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          assessed_skills?: Json
          created_at?: string
          id?: string
          recommendations?: Json | null
          skill_gaps?: Json | null
          target_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_resumes: {
        Row: {
          certifications: Json | null
          created_at: string
          education: Json | null
          email: string | null
          experience: Json | null
          full_name: string | null
          headline: string | null
          id: string
          is_public: boolean | null
          languages: string[] | null
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          projects: Json | null
          resume_data: Json | null
          resume_url: string | null
          skills: string[] | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications?: Json | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          projects?: Json | null
          resume_data?: Json | null
          resume_url?: string | null
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications?: Json | null
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          is_public?: boolean | null
          languages?: string[] | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          projects?: Json | null
          resume_data?: Json | null
          resume_url?: string | null
          skills?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          billing_interval_count: number | null
          created_at: string
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          included_course_ids: string[] | null
          includes_all_courses: boolean | null
          is_active: boolean | null
          max_courses: number | null
          name: string
          org_id: string
          price: number
          sort_order: number | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_interval: string
          billing_interval_count?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          included_course_ids?: string[] | null
          includes_all_courses?: boolean | null
          is_active?: boolean | null
          max_courses?: number | null
          name: string
          org_id: string
          price: number
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          billing_interval_count?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          included_course_ids?: string[] | null
          includes_all_courses?: boolean | null
          is_active?: boolean | null
          max_courses?: number | null
          name?: string
          org_id?: string
          price?: number
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          initiated_by: string | null
          notes: string | null
          org_id: string | null
          retention_days: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
          tables_included: string[] | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          org_id?: string | null
          retention_days?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          tables_included?: string[] | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          org_id?: string | null
          retention_days?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          tables_included?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "system_backups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configuration: {
        Row: {
          category: string
          config_key: string
          config_value: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_editable: boolean | null
          is_sensitive: boolean | null
          org_id: string | null
          updated_at: string
          updated_by: string | null
          value_type: Database["public"]["Enums"]["config_value_type"]
        }
        Insert: {
          category: string
          config_key: string
          config_value?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_editable?: boolean | null
          is_sensitive?: boolean | null
          org_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_type?: Database["public"]["Enums"]["config_value_type"]
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_editable?: boolean | null
          is_sensitive?: boolean | null
          org_id?: string | null
          updated_at?: string
          updated_by?: string | null
          value_type?: Database["public"]["Enums"]["config_value_type"]
        }
        Relationships: [
          {
            foreignKeyName: "system_configuration_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          last_verified_at: string | null
          method: string | null
          phone_number: string | null
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_verified_at?: string | null
          method?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_verified_at?: string | null
          method?: string | null
          phone_number?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_approval_requests: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          org_id: string | null
          rejection_reason: string | null
          requested_at: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          org_id?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_approval_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent_records: {
        Row: {
          consent_given: boolean
          consent_method: string
          consented_at: string
          document_id: string
          document_type: string
          document_version: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_given?: boolean
          consent_method?: string
          consented_at?: string
          document_id: string
          document_type: string
          document_version: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_method?: string
          consented_at?: string
          document_id?: string
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consent_records_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          created_at: string
          custom_role_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_emi: {
        Row: {
          bundle_id: string | null
          course_id: string | null
          created_at: string
          emi_amount: number
          emi_plan_id: string
          id: string
          next_due_date: string | null
          org_id: string
          paid_installments: number | null
          remaining_amount: number
          status: string | null
          total_amount: number
          total_installments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bundle_id?: string | null
          course_id?: string | null
          created_at?: string
          emi_amount: number
          emi_plan_id: string
          id?: string
          next_due_date?: string | null
          org_id: string
          paid_installments?: number | null
          remaining_amount: number
          status?: string | null
          total_amount: number
          total_installments: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bundle_id?: string | null
          course_id?: string | null
          created_at?: string
          emi_amount?: number
          emi_plan_id?: string
          id?: string
          next_due_date?: string | null
          org_id?: string
          paid_installments?: number | null
          remaining_amount?: number
          status?: string | null
          total_amount?: number
          total_installments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_emi_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_emi_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_emi_emi_plan_id_fkey"
            columns: ["emi_plan_id"]
            isOneToOne: false
            referencedRelation: "emi_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_emi_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string | null
          org_id: string
          priority: string | null
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string | null
          org_id: string
          priority?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string | null
          org_id?: string
          priority?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: number
          streak_days: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string | null
          device_name: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active_at: string | null
          location: string | null
          os: string | null
          session_token: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          location?: string | null
          os?: string | null
          session_token: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          location?: string | null
          os?: string | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          last_payment_id: string | null
          next_billing_date: string | null
          org_id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          ended_at?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          last_payment_id?: string | null
          next_billing_date?: string | null
          org_id: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          last_payment_id?: string | null
          next_billing_date?: string | null
          org_id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_grade_submission: {
        Args: { submission_uuid: string }
        Returns: undefined
      }
      check_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      check_course_prerequisites: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_any_permission: {
        Args: { _permissions: string[]; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "sub_admin"
        | "trainer"
        | "mentor"
        | "student"
        | "franchise"
        | "distributor"
        | "super_distributor"
        | "affiliate"
        | "corporate_hr"
      approval_status: "pending" | "approved" | "rejected" | "suspended"
      assessment_status: "draft" | "published" | "closed" | "archived"
      backup_status: "pending" | "in_progress" | "completed" | "failed"
      campaign_status: "draft" | "active" | "paused" | "completed" | "cancelled"
      certificate_type: "course" | "internship" | "experience" | "lor"
      config_value_type: "string" | "number" | "boolean" | "json" | "array"
      emi_status: "pending" | "paid" | "overdue" | "defaulted"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
      franchise_status: "pending" | "approved" | "suspended" | "rejected"
      franchise_type:
        | "franchise"
        | "affiliate"
        | "reseller"
        | "super_distributor"
        | "distributor"
      internship_application_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "withdrawn"
      internship_status: "draft" | "active" | "closed" | "completed"
      internship_task_status:
        | "pending"
        | "in_progress"
        | "submitted"
        | "approved"
        | "revision_needed"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      invoice_status: "draft" | "sent" | "paid" | "cancelled" | "overdue"
      job_application_status:
        | "pending"
        | "shortlisted"
        | "interview_scheduled"
        | "selected"
        | "rejected"
        | "withdrawn"
      job_status: "draft" | "open" | "closed" | "filled"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      moderation_status: "pending" | "approved" | "rejected" | "flagged"
      notification_channel: "email" | "sms" | "whatsapp" | "in_app" | "push"
      notification_status: "pending" | "sent" | "delivered" | "failed" | "read"
      offer_letter_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payout_status: "pending" | "processing" | "completed" | "failed"
      question_type:
        | "mcq"
        | "descriptive"
        | "case_study"
        | "file_upload"
        | "true_false"
        | "fill_blank"
      refund_status:
        | "requested"
        | "processing"
        | "approved"
        | "rejected"
        | "completed"
      reminder_type: "class" | "assignment" | "payment" | "deadline" | "custom"
      submission_status:
        | "in_progress"
        | "submitted"
        | "graded"
        | "retake_allowed"
      subscription_status:
        | "active"
        | "paused"
        | "cancelled"
        | "expired"
        | "past_due"
      wallet_transaction_type:
        | "credit"
        | "debit"
        | "refund"
        | "reward"
        | "referral"
        | "purchase"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "sub_admin",
        "trainer",
        "mentor",
        "student",
        "franchise",
        "distributor",
        "super_distributor",
        "affiliate",
        "corporate_hr",
      ],
      approval_status: ["pending", "approved", "rejected", "suspended"],
      assessment_status: ["draft", "published", "closed", "archived"],
      backup_status: ["pending", "in_progress", "completed", "failed"],
      campaign_status: ["draft", "active", "paused", "completed", "cancelled"],
      certificate_type: ["course", "internship", "experience", "lor"],
      config_value_type: ["string", "number", "boolean", "json", "array"],
      emi_status: ["pending", "paid", "overdue", "defaulted"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
      ],
      franchise_status: ["pending", "approved", "suspended", "rejected"],
      franchise_type: [
        "franchise",
        "affiliate",
        "reseller",
        "super_distributor",
        "distributor",
      ],
      internship_application_status: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      internship_status: ["draft", "active", "closed", "completed"],
      internship_task_status: [
        "pending",
        "in_progress",
        "submitted",
        "approved",
        "revision_needed",
      ],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      invoice_status: ["draft", "sent", "paid", "cancelled", "overdue"],
      job_application_status: [
        "pending",
        "shortlisted",
        "interview_scheduled",
        "selected",
        "rejected",
        "withdrawn",
      ],
      job_status: ["draft", "open", "closed", "filled"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      moderation_status: ["pending", "approved", "rejected", "flagged"],
      notification_channel: ["email", "sms", "whatsapp", "in_app", "push"],
      notification_status: ["pending", "sent", "delivered", "failed", "read"],
      offer_letter_status: ["draft", "sent", "accepted", "declined", "expired"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payout_status: ["pending", "processing", "completed", "failed"],
      question_type: [
        "mcq",
        "descriptive",
        "case_study",
        "file_upload",
        "true_false",
        "fill_blank",
      ],
      refund_status: [
        "requested",
        "processing",
        "approved",
        "rejected",
        "completed",
      ],
      reminder_type: ["class", "assignment", "payment", "deadline", "custom"],
      submission_status: [
        "in_progress",
        "submitted",
        "graded",
        "retake_allowed",
      ],
      subscription_status: [
        "active",
        "paused",
        "cancelled",
        "expired",
        "past_due",
      ],
      wallet_transaction_type: [
        "credit",
        "debit",
        "refund",
        "reward",
        "referral",
        "purchase",
      ],
    },
  },
} as const
