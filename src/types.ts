/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'employee';

export interface DepartmentDefinition {
  id: string;
  name: string;
}

export interface RoleDefinition {
  code: string;
  name: string;
  systemRole: UserRole;
}

export interface PositionDefinition {
  code: string;
  name: string;
  departmentId: string;
  roleCode: string;
  ranks?: string[];
}

export const COMPANY_POSITIONS = [
  { code: '00', name: 'CEO', defaultRole: 'manager', department: 'RetMind' },
  { code: '01', name: 'Large Trade Line Manager', defaultRole: 'manager', department: 'RetMind Large / Trade' },
  { code: '02', name: 'Large FinCore Line Manager', defaultRole: 'manager', department: 'RetMind Large / FinCor' },
  { code: '03', name: 'Operational director', defaultRole: 'manager', department: 'RetMind' },
  { code: '04', name: 'Project Manager', defaultRole: 'manager', department: 'RetMind' },
  { code: '05', name: 'Operational Manager', defaultRole: 'employee', department: 'RetMind' },
  { code: '06', name: 'Team Lead of Developers', defaultRole: 'manager', department: 'RetMind' },
  { code: '07', name: 'Team Lead of DevOps', defaultRole: 'manager', department: 'RetMind DevOps' },
  { code: '08', name: 'DevOps', defaultRole: 'employee', department: 'RetMind DevOps' },
  { code: '09', name: 'Developer PRO', defaultRole: 'employee', department: 'RetMind PRO' },
  { code: '10', name: 'Developer Large', defaultRole: 'employee', department: 'RetMind Large / Trade' },
  { code: '11', name: 'Team Lead of the Support', defaultRole: 'manager', department: 'RetMind Support' },
  { code: '12', name: 'Support Shift Manager', defaultRole: 'employee', department: 'RetMind Support' },
  { code: '13', name: 'Support Specialist', defaultRole: 'employee', department: 'RetMind Support' },
  { code: '14', name: 'Support Intern', defaultRole: 'employee', department: 'RetMind Support' },
  { code: '15', name: 'HR Manager', defaultRole: 'employee', department: 'RetMind' }
];

export interface EmployeeProfile {
  phone?: string;
  department?: string;
  specializations?: string[];
  bio?: string;
  avatarStyle?: string; // Seed or style for UI avatar rendering
  positionCode?: string;
  positionName?: string;
  rank?: string;
}

export interface Employee {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'pending' | 'active';
  createdAt: string;
  profile: EmployeeProfile;
}

export interface Invitation {
  id: string;
  employeeId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted';
  sentAt: string;
  expiresAt: string;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  token: string; // token to perform onboarding
  sentAt: string;
  status: 'sent' | 'read';
}

export interface AuthState {
  user: Employee | null;
  token: string | null;
}

export interface Lesson {
  id: string;
  topic: string;
  description: string;
  content: string;
  pdfUrl?: string;
  videoUrl?: string;
}

export interface CourseBinding {
  positionCode: string;
  positionName?: string;
  rank?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  positionCode?: string;
  positionName?: string;
  rank?: string; // Optional rank restriction
  bindings?: CourseBinding[];
  lessons: Lesson[];
  createdAt: string;
  studyDurationDays?: number;
  examDurationDays?: number;
}

export interface LessonGrade {
  id: string;
  employeeId: string;
  courseId: string;
  lessonId: string;
  score: number; // 1-10
  comment?: string;
  gradedBy: string;
  gradedByName: string;
  gradedAt: string;
}

export type TicketChannel = 'telegram' | 'email' | 'teams' | string;
export type TicketStatus = 'open' | 'resolved' | 'closed';
export type TicketCreatorType = 'office' | 'store';

export interface SupportChannel {
  id: string;
  code: string;
  name: string;
}

export interface SupportClient {
  id: string;
  name: string;
  countries: string[];
}

export interface SupportCountry {
  id: string;
  code: string;
  name: string;
  status?: 'active' | 'archived';
}

export interface SupportKind {
  id: string;
  name: string;
}

export interface SupportStore {
  id: string;
  name: string;
  clientId: string;
  country: string;
  code?: string;
  status?: 'active' | 'closed';
}

export interface TicketAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Ticket {
  id: string;
  channel: string;
  client: string;
  country: string;
  creatorType: TicketCreatorType;
  requesterName: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  assignedToId?: string;
  assignedToName?: string;
  resolutionComment?: string;
  closedById?: string;
  closedByName?: string;
  system?: string;
  module?: string;
  type?: string;
  action?: string;
  kind?: string;
  attachments?: TicketAttachment[];
  storeId?: string;
  storeName?: string;
  startedWorkingAt?: string;
  confirmedAt?: string;
  confirmationAttachment?: TicketAttachment;
}


