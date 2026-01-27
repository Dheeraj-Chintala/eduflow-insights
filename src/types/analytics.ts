// Analytics types for Reports & Analytics Module

export interface StudentProgressStats {
  totalStudents: number;
  activeStudents: number;
  completedCourses: number;
  averageProgress: number;
  enrollmentsThisMonth: number;
  certificatesIssued: number;
}

export interface CourseCompletionData {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  averageProgress: number;
  completionRate: number;
}

export interface DropOffData {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate: number;
}

export interface LessonDropOff {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  viewCount: number;
  completionCount: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface TrainerStats {
  trainerId: string;
  trainerName: string;
  avatarUrl?: string;
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  revenueGenerated: number;
}

export interface FranchiseRevenueData {
  franchiseId: string;
  franchiseName: string;
  franchiseType: string;
  totalSales: number;
  totalCommission: number;
  pendingPayout: number;
  paidCommission: number;
  studentCount: number;
  conversionRate: number;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  conversionFromPrevious: number;
}

export interface FunnelData {
  leads: number;
  signups: number;
  enrollments: number;
  courseStarts: number;
  courseCompletions: number;
  certificatesClaimed: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ReportExportOptions {
  format: 'excel' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
  filters?: Record<string, unknown>;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface AnalyticsFilters {
  timeRange: TimeRange;
  courseId?: string;
  batchId?: string;
  trainerId?: string;
  franchiseId?: string;
}
