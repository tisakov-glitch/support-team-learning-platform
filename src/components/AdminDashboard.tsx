/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, Mail, Phone, BookOpen, Trash2, Edit2, 
  UserCheck, Clock, ShieldCheck, LogOut, Check, X,
  ExternalLink, ChevronRight, Inbox, Eye, Settings, Tag, User, AlertTriangle, Plus, Briefcase, Users, Shield,
  LayoutDashboard, Menu, Search, ChevronDown, ChevronUp, Ticket as TicketIcon,
  Paperclip, FileText, Download, Image, Edit3, Save, Bell
} from 'lucide-react';
import { Employee, SimulatedEmail, UserRole, DepartmentDefinition, RoleDefinition, PositionDefinition, Course, Lesson, LessonGrade, CourseBinding, Ticket, TicketChannel, TicketStatus, TicketCreatorType, SupportChannel, SupportClient, SupportStore, SupportKind, SupportCountry } from '../types';
import { TICKET_CATEGORIES } from '../ticketCategories';
import { ImageTicketAnalyzer } from './ImageTicketAnalyzer';
import { TicketRegistrationForm } from './TicketRegistrationForm';
import { TicketReports } from './TicketReports';
import { InteractivePieChart } from './InteractivePieChart';
import { TicketCategoryManager } from './TicketCategoryManager';
import { BarChart3 } from 'lucide-react';

interface AdminDashboardProps {
  adminUser: Employee;
  onLogout: () => void;
  openEmailFromApp: (token: string) => void;
  simulatedEmails: SimulatedEmail[];
  refreshEmails: () => void;
}

export default function AdminDashboard({ 
  adminUser, 
  onLogout, 
  openEmailFromApp, 
  simulatedEmails, 
  refreshEmails 
}: AdminDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Tab Management State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'structure' | 'courses' | 'attestation' | 'tickets' | 'reports'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [structureSubTab, setStructureSubTab] = useState<'departments' | 'positions' | 'roles' | 'ranks'>('departments');

  // Employee Tab Filtering & Selection State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeFilterDepartment, setEmployeeFilterDepartment] = useState('all');
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState<'all' | 'active' | 'pending'>('all');
  const [mobileViewingDetails, setMobileViewingDetails] = useState(false);

  // Dynamic Structure State loaded from API
  const [dbDepartments, setDbDepartments] = useState<DepartmentDefinition[]>([]);
  const [dbRoles, setDbRoles] = useState<RoleDefinition[]>([]);
  const [dbPositions, setDbPositions] = useState<PositionDefinition[]>([]);

  // Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPositionCode, setNewPositionCode] = useState('13'); // default: Support Specialist
  const [newDepartment, setNewDepartment] = useState('RetMind Support');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newBio, setNewBio] = useState('');
  const [newSpecString, setNewSpecString] = useState(''); // comma-separated specializations
  const [newRank, setNewRank] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPositionCode, setEditPositionCode] = useState('13');
  const [editDepartment, setEditDepartment] = useState('RetMind Support');
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editBio, setEditBio] = useState('');
  const [editSpecString, setEditSpecString] = useState('');
  const [editRank, setEditRank] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Email Server Simulator State
  const [showEmailSimulator, setShowEmailSimulator] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Dashboard Analytics States ---
  const [dashTimeframe, setDashTimeframe] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [dashSelectedClient, setDashSelectedClient] = useState<string | null>(null);
  const [dashSelectedModule, setDashSelectedModule] = useState<string | null>(null);
  const [dashSelectedSystem, setDashSelectedSystem] = useState<string | null>(null);

  // --- Departments Forms State ---
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [isDeptSubmitting, setIsDeptSubmitting] = useState(false);

  // --- Positions Forms State ---
  const [newPosCode, setNewPosCode] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const [newPosDeptId, setNewPosDeptId] = useState('');
  const [newPosRoleCode, setNewPosRoleCode] = useState('');
  const [newPosRanks, setNewPosRanks] = useState('');
  const [editingPosCode, setEditingPosCode] = useState<string | null>(null);
  const [editingPosName, setEditingPosName] = useState('');
  const [editingPosDeptId, setEditingPosDeptId] = useState('');
  const [editingPosRoleCode, setEditingPosRoleCode] = useState('');
  const [editingPosRanks, setEditingPosRanks] = useState('');
  const [isPosSubmitting, setIsPosSubmitting] = useState(false);

  // --- Roles Forms State ---
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSys, setNewRoleSys] = useState<UserRole>('employee');
  const [editingRoleCodeState, setEditingRoleCodeState] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  const [editingRoleSys, setEditingRoleSys] = useState<UserRole>('employee');
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);

  // --- Ranks Forms State ---
  const [selectedRankPosCode, setSelectedRankPosCode] = useState<string>('');
  const [newRankName, setNewRankName] = useState<string>('');
  const [editingRankIndex, setEditingRankIndex] = useState<number | null>(null);
  const [editingRankNameValue, setEditingRankNameValue] = useState<string>('');
  const [isRankSubmitting, setIsRankSubmitting] = useState(false);

  // --- Courses State ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseFilterPosition, setCourseFilterPosition] = useState('all');
  const [mobileViewingCourseDetails, setMobileViewingCourseDetails] = useState(false);

  // Course Form Fields
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [coursePositionCode, setCoursePositionCode] = useState('');
  const [courseRank, setCourseRank] = useState('');
  const [courseBindings, setCourseBindings] = useState<CourseBinding[]>([]);
  const [tempBindingPosCode, setTempBindingPosCode] = useState('');
  const [tempBindingRank, setTempBindingRank] = useState('');
  const [courseStudyDuration, setCourseStudyDuration] = useState<number>(7);
  const [courseExamDuration, setCourseExamDuration] = useState<number>(3);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [isCourseSubmitting, setIsCourseSubmitting] = useState(false);

  // --- Attestation / Grades State ---
  const [grades, setGrades] = useState<LessonGrade[]>([]);
  const [isGradesLoading, setIsGradesLoading] = useState(false);
  const [attestationSubTab, setAttestationSubTab] = useState<'analytics' | 'evaluate'>('analytics');
  const [attestationEmployeeId, setAttestationEmployeeId] = useState('');
  const [attestationCourseId, setAttestationCourseId] = useState('');
  const [attestationScore, setAttestationScore] = useState<number>(10);
  const [attestationComment, setAttestationComment] = useState('');
  const [activeLessonToGrade, setActiveLessonToGrade] = useState<Lesson | null>(null);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [attestationSearchQuery, setAttestationSearchQuery] = useState('');
  const [attestationFilterPosition, setAttestationFilterPosition] = useState('all');
  const [mobileViewingAttestationDetails, setMobileViewingAttestationDetails] = useState(false);
  const [expandedAttestationCourses, setExpandedAttestationCourses] = useState<Record<string, boolean>>({});

  // --- Ticket Academy State ---
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketFilterChannel, setTicketFilterChannel] = useState<string>('all');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('open');
  const [ticketFilterClient, setTicketFilterClient] = useState<string>('all');
  const [ticketFilterCountry, setTicketFilterCountry] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showAddTicketForm, setShowAddTicketForm] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const getCurrentDatetimeLocal = () => {
    try {
      const date = new Date();
      const tzoffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // New Ticket Form State
  const [newTicketChannel, setNewTicketChannel] = useState<TicketChannel>('telegram');
  const [newTicketClient, setNewTicketClient] = useState('');
  const [newTicketCountry, setNewTicketCountry] = useState('');
  const [newTicketCreatorType, setNewTicketCreatorType] = useState<TicketCreatorType>('store');
  const [newTicketRequesterName, setNewTicketRequesterName] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketKind, setNewTicketKind] = useState('');
  const [ticketResolutionComment, setTicketResolutionComment] = useState('');

  // Categorization states for new ticket
  const [newTicketSystem, setNewTicketSystem] = useState('');
  const [newTicketModule, setNewTicketModule] = useState('');
  const [newTicketType, setNewTicketType] = useState('');
  const [newTicketAction, setNewTicketAction] = useState('');
  const [newTicketAttachments, setNewTicketAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [newTicketStoreId, setNewTicketStoreId] = useState('');
  const [newTicketStoreName, setNewTicketStoreName] = useState('');
  const [newTicketCreatedAt, setNewTicketCreatedAt] = useState(getCurrentDatetimeLocal());
  const [newTicketStartedWorkingAt, setNewTicketStartedWorkingAt] = useState('');
  const [newTicketClosedAt, setNewTicketClosedAt] = useState('');
  const [newTicketConfirmedAt, setNewTicketConfirmedAt] = useState('');
  const [newTicketResolutionComment, setNewTicketResolutionComment] = useState('');
  const [newTicketConfirmationAttachment, setNewTicketConfirmationAttachment] = useState<{ name: string; size: number; type: string; url: string } | null>(null);
  const [newTicketAssignedToId, setNewTicketAssignedToId] = useState('');
  const [newTicketAssignedToName, setNewTicketAssignedToName] = useState('');

  // Metadata editing state for existing ticket in AdminDashboard
  const [isEditingTicketMeta, setIsEditingTicketMeta] = useState(false);
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [editStartedWorkingAt, setEditStartedWorkingAt] = useState('');
  const [editClosedAt, setEditClosedAt] = useState('');
  const [editConfirmedAt, setEditConfirmedAt] = useState('');
  const [editConfirmationAttachment, setEditConfirmationAttachment] = useState<{ name: string; size: number; type: string; url: string } | null>(null);

  const getUpcomingAttestations = () => {
    const alerts: Array<{
      employeeId: string;
      employeeName: string;
      courseId: string;
      courseTitle: string;
      startedAt: string;
      studyDurationDays: number;
      examDurationDays: number;
      daysElapsed: number;
      status: 'learning_over' | 'exam_overdue' | 'learning_near_end';
      deadlineDate: Date;
    }> = [];

    employees.forEach(emp => {
      if (emp.status === 'pending') return;

      // Filter courses assigned to this employee's position and rank
      const assigned = courses.filter(c => {
        if (c.bindings && c.bindings.length > 0) {
          return c.bindings.some(b => b.positionCode === emp.profile.positionCode && (!b.rank || b.rank === emp.profile.rank));
        }
        return c.positionCode === emp.profile.positionCode && (!c.rank || c.rank === emp.profile.rank);
      });

      assigned.forEach(course => {
        const starts = emp.profile.courseStartedDates || {};
        const startedAt = starts[course.id];
        if (!startedAt) return; // Not started yet

        // Check if already fully evaluated (all lessons of the course have grades)
        const courseLessons = course.lessons || [];
        const courseGrades = grades.filter(g => g.employeeId === emp.id && g.courseId === course.id);
        const isCompleted = courseLessons.length > 0 && courseLessons.every(lesson => 
          courseGrades.some(g => g.lessonId === lesson.id && g.score > 0)
        );

        if (isCompleted) return; // Already passed attestation!

        const studyDays = course.studyDurationDays || 7;
        const examDays = course.examDurationDays || 3;

        const startDate = new Date(startedAt);
        const today = new Date();
        const diffTime = today.getTime() - startDate.getTime();
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (daysElapsed >= studyDays) {
          const deadlineDate = new Date(startDate.getTime() + (studyDays + examDays) * 24 * 60 * 60 * 1000);
          const isOverdue = daysElapsed >= (studyDays + examDays);

          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            courseId: course.id,
            courseTitle: course.title,
            startedAt,
            studyDurationDays: studyDays,
            examDurationDays: examDays,
            daysElapsed,
            status: isOverdue ? 'exam_overdue' : 'learning_over',
            deadlineDate
          });
        } else if (studyDays - daysElapsed <= 2 && studyDays - daysElapsed > 0) {
          const deadlineDate = new Date(startDate.getTime() + (studyDays + examDays) * 24 * 60 * 60 * 1000);
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            courseId: course.id,
            courseTitle: course.title,
            startedAt,
            studyDurationDays: studyDays,
            examDurationDays: examDays,
            daysElapsed,
            status: 'learning_near_end',
            deadlineDate
          });
        }
      });
    });

    return alerts;
  };

  // --- Support Infrastructure State ---
  const [supportChannels, setSupportChannels] = useState<SupportChannel[]>([]);
  const [supportClients, setSupportClients] = useState<SupportClient[]>([]);
  const [supportStores, setSupportStores] = useState<SupportStore[]>([]);
  const [supportKinds, setSupportKinds] = useState<SupportKind[]>([]);
  const [supportCountries, setSupportCountries] = useState<SupportCountry[]>([]);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [ticketAcademySubTab, setTicketAcademySubTab] = useState<'tickets' | 'channels' | 'clients' | 'stores' | 'kinds' | 'countries' | 'categories'>('tickets');

  // Support Countries Form State
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [editingCountryId, setEditingCountryId] = useState<string | null>(null);
  const [editingCountryCode, setEditingCountryCode] = useState('');
  const [editingCountryName, setEditingCountryName] = useState('');

  // Support Kinds Form State
  const [newKindName, setNewKindName] = useState('');
  const [editingKindId, setEditingKindId] = useState<string | null>(null);
  const [editingKindName, setEditingKindName] = useState('');

  // Support Channels Form State
  const [newChannelCode, setNewChannelCode] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingChannelCode, setEditingChannelCode] = useState('');
  const [editingChannelName, setEditingChannelName] = useState('');

  // Support Clients Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientCountries, setNewClientCountries] = useState<string[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState('');
  const [editingClientCountries, setEditingClientCountries] = useState<string[]>([]);
  const [customNewCountry, setCustomNewCountry] = useState('');
  const [customEditCountry, setCustomEditCountry] = useState('');

  // Support Stores Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreClientId, setNewStoreClientId] = useState('');
  const [newStoreCountry, setNewStoreCountry] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreStatus, setNewStoreStatus] = useState<'active' | 'closed'>('active');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState('');
  const [editingStoreClientId, setEditingStoreClientId] = useState('');
  const [editingStoreCountry, setEditingStoreCountry] = useState('');
  const [editingStoreCode, setEditingStoreCode] = useState('');
  const [editingStoreStatus, setEditingStoreStatus] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    fetchEmployees();
    fetchStructureData();
    fetchCourses();
    fetchGrades();
    fetchTickets();
    fetchSupportInfrastructure();
  }, []);

  const filteredAndSortedEmployees = React.useMemo(() => {
    return employees
      .filter((emp) => {
        const query = employeeSearchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          emp.name.toLowerCase().includes(query) || 
          emp.email.toLowerCase().includes(query) || 
          (emp.profile.phone && emp.profile.phone.toLowerCase().includes(query)) ||
          (emp.profile.positionName && emp.profile.positionName.toLowerCase().includes(query)) ||
          (emp.profile.department && emp.profile.department.toLowerCase().includes(query));
        
        const matchesDept = employeeFilterDepartment === 'all' || emp.profile.department === employeeFilterDepartment;
        const matchesStatus = employeeFilterStatus === 'all' || emp.status === employeeFilterStatus;
        
        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [employees, employeeSearchQuery, employeeFilterDepartment, employeeFilterStatus]);

  useEffect(() => {
    if (activeTab === 'employees' && filteredAndSortedEmployees.length > 0) {
      if (!selectedEmployeeId || !filteredAndSortedEmployees.some(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(filteredAndSortedEmployees[0].id);
      }
    }
  }, [activeTab, filteredAndSortedEmployees, selectedEmployeeId]);

  const filteredCourses = React.useMemo(() => {
    return courses
      .filter((course) => {
        const query = courseSearchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          course.title.toLowerCase().includes(query) || 
          (course.description && course.description.toLowerCase().includes(query)) ||
          course.lessons.some(l => l.topic.toLowerCase().includes(query));
        
        let matchesPosition = true;
        if (courseFilterPosition !== 'all') {
          if (course.bindings && course.bindings.length > 0) {
            matchesPosition = course.bindings.some(b => b.positionCode === courseFilterPosition);
          } else {
            matchesPosition = course.positionCode === courseFilterPosition;
          }
        }
        
        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }, [courses, courseSearchQuery, courseFilterPosition]);

  useEffect(() => {
    if (activeTab === 'courses' && filteredCourses.length > 0) {
      if (!selectedCourseId || !filteredCourses.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(filteredCourses[0].id);
      }
    }
  }, [activeTab, filteredCourses, selectedCourseId]);

  const filteredAttestationEmployees = React.useMemo(() => {
    return employees
      .filter((emp) => {
        if (emp.status === 'pending') return false;
        
        const query = attestationSearchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
          emp.name.toLowerCase().includes(query) || 
          emp.email.toLowerCase().includes(query) || 
          (emp.profile.positionName && emp.profile.positionName.toLowerCase().includes(query)) ||
          (emp.profile.department && emp.profile.department.toLowerCase().includes(query));
        
        const matchesPosition = attestationFilterPosition === 'all' || emp.profile.positionCode === attestationFilterPosition;
        
        return matchesSearch && matchesPosition;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [employees, attestationSearchQuery, attestationFilterPosition]);

  useEffect(() => {
    if (activeTab === 'attestation' && attestationSubTab === 'evaluate' && filteredAttestationEmployees.length > 0) {
      if (!attestationEmployeeId || !filteredAttestationEmployees.some(e => e.id === attestationEmployeeId)) {
        const firstEmp = filteredAttestationEmployees[0];
        setAttestationEmployeeId(firstEmp.id);
        
        // Auto-select recommended course
        const assigned = courses.filter(c => {
          if (c.bindings && c.bindings.length > 0) {
            return c.bindings.some(b => b.positionCode === firstEmp.profile.positionCode && (!b.rank || b.rank === firstEmp.profile.rank));
          }
          return c.positionCode === firstEmp.profile.positionCode && (!c.rank || c.rank === firstEmp.profile.rank);
        });
        
        if (assigned.length > 0) {
          setAttestationCourseId(assigned[0].id);
        } else if (courses.length > 0) {
          setAttestationCourseId(courses[0].id);
        }
      }
    }
  }, [activeTab, attestationSubTab, filteredAttestationEmployees, attestationEmployeeId, courses]);

  const fetchCourses = async () => {
    try {
      setIsCoursesLoading(true);
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить курсы');
      }
      setCourses(data);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setIsGradesLoading(true);
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/grades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    } finally {
      setIsGradesLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setIsTicketsLoading(true);
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsTicketsLoading(false);
    }
  };

  const fetchSupportInfrastructure = async () => {
    setIsSupportLoading(true);
    try {
      const token = localStorage.getItem('support_learning_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [channelsRes, clientsRes, storesRes, kindsRes, countriesRes] = await Promise.all([
        fetch('/api/support-channels', { headers }),
        fetch('/api/support-clients', { headers }),
        fetch('/api/support-stores', { headers }),
        fetch('/api/support-kinds', { headers }),
        fetch('/api/support-countries', { headers })
      ]);

      if (channelsRes.ok) {
        const channels = await channelsRes.json();
        setSupportChannels(channels);
      }
      if (clientsRes.ok) {
        const clients = await clientsRes.json();
        setSupportClients(clients);
      }
      if (storesRes.ok) {
        const stores = await storesRes.json();
        setSupportStores(stores);
      }
      if (kindsRes.ok) {
        const kinds = await kindsRes.json();
        setSupportKinds(kinds);
      }
      if (countriesRes.ok) {
        const countries = await countriesRes.json();
        setSupportCountries(countries);
      }
    } catch (err) {
      console.error('Failed to fetch support infrastructure:', err);
    } finally {
      setIsSupportLoading(false);
    }
  };

  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryCode || !newCountryName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-countries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: newCountryCode, name: newCountryName })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось создать страну');
      }
      const created = await response.json();
      setSupportCountries(prev => [...prev, created]);
      setNewCountryCode('');
      setNewCountryName('');
      setSuccessMsg('Страна успешно добавлена!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountryId || !editingCountryCode || !editingCountryName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-countries/${editingCountryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: editingCountryCode, name: editingCountryName })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось обновить страну');
      }
      const updated = await response.json();
      setSupportCountries(prev => prev.map(c => c.id === editingCountryId ? updated : c));
      setEditingCountryId(null);
      setEditingCountryCode('');
      setEditingCountryName('');
      setSuccessMsg('Страна успешно обновлена!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту страну?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-countries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Не удалось удалить страну');
      }
      setSupportCountries(prev => prev.filter(c => c.id !== id));
      setSuccessMsg('Страна успешно удалена!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateKind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKindName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-kinds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKindName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create ticket kind');
      setSupportKinds(prev => [...prev, data]);
      setNewKindName('');
      setSuccessMsg('Вид тикета успешно создан!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateKind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKindId || !editingKindName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-kinds/${editingKindId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingKindName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update ticket kind');
      setSupportKinds(prev => prev.map(k => k.id === editingKindId ? data : k));
      setEditingKindId(null);
      setEditingKindName('');
      setSuccessMsg('Вид тикета успешно обновлен!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteKind = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот вид тикета?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-kinds/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete ticket kind');
      }
      setSupportKinds(prev => prev.filter(k => k.id !== id));
      setSuccessMsg('Вид тикета успешно удален!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelCode || !newChannelName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: newChannelCode, name: newChannelName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create channel');
      setSupportChannels(prev => [...prev, data]);
      setNewChannelCode('');
      setNewChannelName('');
      setSuccessMsg('Канал связи успешно создан!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannelId || !editingChannelCode || !editingChannelName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-channels/${editingChannelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: editingChannelCode, name: editingChannelName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update channel');
      setSupportChannels(prev => prev.map(c => c.id === editingChannelId ? data : c));
      setEditingChannelId(null);
      setSuccessMsg('Канал связи успешно обновлен!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот канал связи?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-channels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete channel');
      }
      setSupportChannels(prev => prev.filter(c => c.id !== id));
      setSuccessMsg('Канал связи успешно удален!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newClientName, countries: newClientCountries })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create client');
      setSupportClients(prev => [...prev, data]);
      setNewClientName('');
      setNewClientCountries([]);
      setSuccessMsg('Клиент успешно добавлен!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientId || !editingClientName) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-clients/${editingClientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingClientName, countries: editingClientCountries })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update client');
      setSupportClients(prev => prev.map(c => c.id === editingClientId ? data : c));
      setEditingClientId(null);
      setSuccessMsg('Данные клиента успешно обновлены!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete client');
      }
      setSupportClients(prev => prev.filter(c => c.id !== id));
      setSuccessMsg('Клиент успешно удален!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreClientId || !newStoreCountry) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStoreName,
          clientId: newStoreClientId,
          country: newStoreCountry,
          code: newStoreCode || undefined,
          status: newStoreStatus
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create store');
      setSupportStores(prev => [...prev, data]);
      setNewStoreName('');
      setNewStoreClientId('');
      setNewStoreCountry('');
      setNewStoreCode('');
      setNewStoreStatus('active');
      setSuccessMsg('Магазин успешно добавлен!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreId || !editingStoreName || !editingStoreClientId || !editingStoreCountry) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-stores/${editingStoreId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingStoreName,
          clientId: editingStoreClientId,
          country: editingStoreCountry,
          code: editingStoreCode || '',
          status: editingStoreStatus
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update store');
      setSupportStores(prev => prev.map(s => s.id === editingStoreId ? data : s));
      setEditingStoreId(null);
      setSuccessMsg('Данные магазина успешно обновлены!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот магазин?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/support-stores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete store');
      }
      setSupportStores(prev => prev.filter(s => s.id !== id));
      setSuccessMsg('Магазин успешно удален!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileAttachment = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setNewTicketAttachments(prev => [
            ...prev,
            {
              name: file.name,
              size: file.size,
              type: file.type,
              url: e.target.result as string
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const formatIsoToDatetimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzoffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const handleSaveTicketMeta = async (ticketId: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          createdAt: editCreatedAt ? new Date(editCreatedAt).toISOString() : undefined,
          startedWorkingAt: editStartedWorkingAt ? new Date(editStartedWorkingAt).toISOString() : null,
          closedAt: editClosedAt ? new Date(editClosedAt).toISOString() : null,
          confirmedAt: editConfirmedAt ? new Date(editConfirmedAt).toISOString() : null,
          confirmationAttachment: editConfirmationAttachment || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось сохранить изменения');
      }

      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      setSuccessMsg('Дополнительные реквизиты тикета успешно обновлены!');
      setIsEditingTicketMeta(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmationFileAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setEditConfirmationAttachment({
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceRecognized = (data: any, isAppend?: boolean) => {
    if (!data) return;
    
    if (isAppend) {
      if (data.requesterName) {
        setNewTicketRequesterName(prev => {
          if (!prev) return data.requesterName;
          if (prev.toLowerCase().includes(data.requesterName.toLowerCase())) return prev;
          return `${prev}, ${data.requesterName}`;
        });
      }
      if (data.subject) {
        setNewTicketSubject(prev => {
          if (!prev) return data.subject;
          if (prev.toLowerCase().includes(data.subject.toLowerCase())) return prev;
          return `${prev} | ${data.subject}`;
        });
      }
      if (data.description) {
        setNewTicketDescription(prev => {
          if (!prev) return data.description;
          return `${prev}\n${data.description}`;
        });
      }
    } else {
      if (data.requesterName) setNewTicketRequesterName(data.requesterName);
      if (data.subject) setNewTicketSubject(data.subject);
      if (data.description) setNewTicketDescription(data.description);
    }

    if (data.datetime) {
      const cleanDt = data.datetime.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) {
        setNewTicketCreatedAt(cleanDt);
      }
    }

    if (data.startedWorkingAt) {
      const cleanDt = data.startedWorkingAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) {
        setNewTicketStartedWorkingAt(cleanDt);
      }
    }

    if (data.closedAt) {
      const cleanDt = data.closedAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) {
        setNewTicketClosedAt(cleanDt);
      }
    }

    if (data.confirmedAt) {
      const cleanDt = data.confirmedAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) {
        setNewTicketConfirmedAt(cleanDt);
      }
    }

    // Note: resolutionComment is intentionally left empty so employees write how they resolved the issue manually.
    
    if (data.channel) {
      const matchedChannel = (supportChannels || []).find(ch => 
        ch.name.toLowerCase() === data.channel.toLowerCase() ||
        ch.code.toLowerCase() === data.channel.toLowerCase() ||
        ch.name.toLowerCase().includes(data.channel.toLowerCase()) ||
        data.channel.toLowerCase().includes(ch.name.toLowerCase())
      );
      if (matchedChannel) {
        setNewTicketChannel(matchedChannel.code as any);
      }
    }

    if (data.country) {
      const matchedCountry = (supportCountries || []).find(cnt => 
        cnt.name.toLowerCase() === data.country.toLowerCase() ||
        cnt.code.toLowerCase() === data.country.toLowerCase() ||
        cnt.name.toLowerCase().includes(data.country.toLowerCase()) ||
        data.country.toLowerCase().includes(cnt.name.toLowerCase())
      );
      if (matchedCountry) {
        setNewTicketCountry(matchedCountry.name);
      } else {
        setNewTicketCountry(data.country);
      }
    }

    if (data.storeId) {
      if (data.storeId === 'all') {
        setNewTicketStoreId('all');
        setNewTicketStoreName('Все магазины');
        setNewTicketCreatorType('store');
      } else {
        const matchedStore = supportStores.find(s => 
          s.id === data.storeId || 
          (s.code && s.code.toLowerCase() === data.storeId.toLowerCase()) ||
          s.name.toLowerCase().includes(data.storeId.toLowerCase()) ||
          data.storeId.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedStore) {
          setNewTicketStoreId(matchedStore.id);
          setNewTicketStoreName(`${matchedStore.name} (${matchedStore.code || ''})`);
          setNewTicketCreatorType('store');

          // Auto-infer Client from Store
          const storeClient = supportClients.find(c => c.id === matchedStore.clientId);
          if (storeClient) {
            setNewTicketClient(storeClient.name);
          }

          // Auto-infer Country from Store
          if (matchedStore.countryId) {
            const storeCountryObj = (supportCountries || []).find(c => c.id === matchedStore.countryId);
            if (storeCountryObj) {
              setNewTicketCountry(storeCountryObj.name);
            }
          } else if (matchedStore.country) {
            setNewTicketCountry(matchedStore.country);
          }
        }
      }
    }

    if (data.client) {
      const matchedClient = supportClients.find(c => 
        c.name.toLowerCase() === data.client.toLowerCase() ||
        c.name.toLowerCase().includes(data.client.toLowerCase()) ||
        data.client.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedClient) {
        setNewTicketClient(matchedClient.name);
        if (matchedClient.countries && matchedClient.countries.length > 0) {
          setNewTicketCountry(prev => prev || matchedClient.countries[0]);
        }
      }
    }

    if (data.system) {
      const matchedSys = TICKET_CATEGORIES.find(sys => 
        sys.name.toLowerCase() === data.system.toLowerCase()
      );
      if (matchedSys) {
        setNewTicketSystem(matchedSys.name);
        
        if (data.module) {
          const matchedMod = matchedSys.modules.find(mod => 
            mod.name.toLowerCase() === data.module.toLowerCase() ||
            mod.name.toLowerCase().includes(data.module.toLowerCase())
          );
          if (matchedMod) {
            setNewTicketModule(matchedMod.name);
            
            if (data.type) {
              const matchedT = matchedMod.types.find(t => 
                t.name.toLowerCase() === data.type.toLowerCase() ||
                t.name.toLowerCase().includes(data.type.toLowerCase())
              );
              if (matchedT) {
                setNewTicketType(matchedT.name);
                
                if (data.action && matchedT.actions?.includes(data.action)) {
                  setNewTicketAction(data.action);
                }
              }
            }
          }
        }
      }
    }

    if (data.kind) {
      const matchedKind = supportKinds.find(k => 
        k.name.toLowerCase() === data.kind.toLowerCase() ||
        k.name.toLowerCase().includes(data.kind.toLowerCase())
      );
      if (matchedKind) {
        setNewTicketKind(matchedKind.name);
      }
    }
  };

  const handleRegisterTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketClient || !newTicketSubject || !newTicketSystem || !newTicketModule || !newTicketType) {
      setError('Заполните все обязательные поля, включая детальную классификацию (Система, Модуль, Тип)');
      return;
    }
    if (newTicketCreatorType === 'store' && !newTicketStoreId) {
      setError('Пожалуйста, выберите магазин!');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsSubmittingTicket(true);
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channel: newTicketChannel,
          client: newTicketClient,
          country: newTicketCountry,
          creatorType: newTicketCreatorType,
          storeId: newTicketCreatorType === 'store' ? (newTicketStoreId || undefined) : undefined,
          storeName: newTicketCreatorType === 'store' ? (newTicketStoreName || undefined) : undefined,
          requesterName: newTicketRequesterName,
          subject: newTicketSubject,
          description: newTicketDescription,
          kind: newTicketKind,
          system: newTicketSystem,
          module: newTicketModule,
          type: newTicketType,
          action: newTicketAction,
          attachments: newTicketAttachments,
          createdAt: newTicketCreatedAt ? new Date(newTicketCreatedAt).toISOString() : undefined,
          startedWorkingAt: newTicketStartedWorkingAt ? new Date(newTicketStartedWorkingAt).toISOString() : undefined,
          closedAt: newTicketClosedAt ? new Date(newTicketClosedAt).toISOString() : undefined,
          confirmedAt: newTicketConfirmedAt ? new Date(newTicketConfirmedAt).toISOString() : undefined,
          resolutionComment: newTicketResolutionComment || undefined,
          confirmationAttachment: newTicketConfirmationAttachment || undefined,
          assignedToId: newTicketAssignedToId || undefined,
          assignedToName: newTicketAssignedToName || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось зарегистрировать тикет');
      }
      setTickets(prev => [data, ...prev]);
      setSuccessMsg('Тикет успешно зарегистрирован!');
      
      setNewTicketClient('');
      setNewTicketRequesterName('');
      setNewTicketSubject('');
      setNewTicketDescription('');
      setNewTicketKind('');
      setNewTicketSystem('');
      setNewTicketModule('');
      setNewTicketType('');
      setNewTicketAction('');
      setNewTicketAttachments([]);
      setNewTicketStoreId('');
      setNewTicketStoreName('');
      setNewTicketAssignedToId('');
      setNewTicketAssignedToName('');
      setNewTicketCreatedAt(getCurrentDatetimeLocal());
      setNewTicketStartedWorkingAt('');
      setNewTicketClosedAt('');
      setNewTicketConfirmedAt('');
      setNewTicketResolutionComment('');
      setNewTicketConfirmationAttachment(null);
      setShowAddTicketForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, nextStatus: TicketStatus, resolutionText?: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const body: any = { status: nextStatus };
      if (resolutionText !== undefined) {
        body.resolutionComment = resolutionText;
      }
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось обновить статус тикета');
      }
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
      setSuccessMsg(`Тикет успешно ${nextStatus === 'resolved' ? 'решен' : nextStatus === 'closed' ? 'закрыт' : 'обновлен'}`);
      setTicketResolutionComment('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedToId: adminUser.id,
          assignedToName: adminUser.name
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось взять тикет в работу');
      }
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
      setSuccessMsg('Вы успешно взяли тикет в работу!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignTicket = async (ticketId: string, employeeId: string, employeeName: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignedToId: employeeId || null,
          assignedToName: employeeName || ''
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось назначить исполнителя');
      }
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
      setSuccessMsg(employeeId ? `Исполнитель успешно назначен: ${employeeName}` : 'Назначение исполнителя снято');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Вы уверены, что хотите безвозвратно удалить этот тикет?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Не удалось удалить тикет');
      }
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      setSuccessMsg('Тикет успешно удален');
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmitGrade = async (lessonId: string, scoreValue: number, commentValue: string) => {
    if (!attestationEmployeeId || !attestationCourseId || !lessonId) return;
    setError('');
    setSuccessMsg('');
    setIsSubmittingGrade(true);
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: attestationEmployeeId,
          courseId: attestationCourseId,
          lessonId,
          score: scoreValue,
          comment: commentValue
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения оценки');
      
      setGrades(prev => {
        const idx = prev.findIndex(g => g.employeeId === data.employeeId && g.courseId === data.courseId && g.lessonId === data.lessonId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        } else {
          return [...prev, data];
        }
      });
      
      setSuccessMsg('Оценка успешно сохранена!');
      setActiveLessonToGrade(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const handleAddCourseBinding = () => {
    if (!tempBindingPosCode) return;
    
    // Find if already exists
    const exists = courseBindings.some(
      b => b.positionCode === tempBindingPosCode && (b.rank || '') === (tempBindingRank || '')
    );
    
    if (exists) {
      alert('Эта привязка уже добавлена к списку');
      return;
    }
    
    const pos = dbPositions.find(p => p.code === tempBindingPosCode);
    const newBinding: CourseBinding = {
      positionCode: tempBindingPosCode,
      positionName: pos ? pos.name : 'Unknown Position',
      rank: tempBindingRank || undefined
    };
    
    setCourseBindings(prev => [...prev, newBinding]);
    setTempBindingPosCode('');
    setTempBindingRank('');
  };

  const handleRemoveCourseBinding = (idx: number) => {
    setCourseBindings(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateOrUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsCourseSubmitting(true);

    if (courseBindings.length === 0) {
      setError('Необходимо добавить хотя бы одну привязку к должности для этого курса');
      setIsCourseSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('support_learning_token');
      const url = editingCourseId ? `/api/courses/${editingCourseId}` : '/api/courses';
      const method = editingCourseId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
          positionCode: courseBindings[0]?.positionCode || '',
          rank: courseBindings[0]?.rank || undefined,
          bindings: courseBindings,
          lessons: courseLessons,
          studyDurationDays: courseStudyDuration,
          examDurationDays: courseExamDuration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить курс');
      }

      setSuccessMsg(editingCourseId ? 'Курс успешно обновлен!' : 'Курс успешно создан!');
      setShowCourseForm(false);
      resetCourseForm();
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCourseSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс?')) return;
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось удалить курс');
      }

      setSuccessMsg('Курс успешно удален!');
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditCourseClick = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title);
    setCourseDescription(course.description);
    setCoursePositionCode(course.positionCode || '');
    setCourseRank(course.rank || '');
    setCourseStudyDuration(course.studyDurationDays || 7);
    setCourseExamDuration(course.examDurationDays || 3);
    
    // If course already has bindings, use them, otherwise build a single default binding
    if (course.bindings && course.bindings.length > 0) {
      setCourseBindings(course.bindings);
    } else if (course.positionCode) {
      setCourseBindings([{
        positionCode: course.positionCode,
        positionName: course.positionName || dbPositions.find(p => p.code === course.positionCode)?.name || 'Unknown',
        rank: course.rank
      }]);
    } else {
      setCourseBindings([]);
    }

    setCourseLessons(course.lessons || []);
    setShowCourseForm(true);
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseDescription('');
    setCoursePositionCode('');
    setCourseRank('');
    setCourseBindings([]);
    setTempBindingPosCode('');
    setTempBindingRank('');
    setCourseStudyDuration(7);
    setCourseExamDuration(3);
    setCourseLessons([]);
  };

  const handleAddLessonField = () => {
    setCourseLessons(prev => [
      ...prev,
      {
        id: `lesson-${Date.now()}-${prev.length}`,
        topic: '',
        description: '',
        content: '',
        pdfUrl: '',
        videoUrl: ''
      }
    ]);
  };

  const handleRemoveLessonField = (idx: number) => {
    setCourseLessons(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLessonFieldChange = (idx: number, field: keyof Lesson, value: string) => {
    setCourseLessons(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось загрузить сотрудников');
      }
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStructureData = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [deptRes, roleRes, posRes] = await Promise.all([
        fetch('/api/departments', { headers }),
        fetch('/api/roles', { headers }),
        fetch('/api/positions', { headers })
      ]);

      if (deptRes.ok && roleRes.ok && posRes.ok) {
        const [depts, rolesList, positionsList] = await Promise.all([
          deptRes.json(),
          roleRes.json(),
          posRes.json()
        ]);
        setDbDepartments(depts);
        setDbRoles(rolesList);
        setDbPositions(positionsList);

        // Auto-select defaults for registration form if it hasn't been set
        if (depts.length > 0 && !newDeptName) {
          const defaultDept = depts[0].name;
          setNewDepartment(defaultDept);
          const filteredPos = positionsList.filter((p: any) => p.departmentId === depts[0].id);
          if (filteredPos.length > 0) {
            setNewPositionCode(filteredPos[0].code);
            const roleObj = rolesList.find((r: any) => r.code === filteredPos[0].roleCode);
            if (roleObj) {
              setNewRole(roleObj.systemRole);
            }
            if (filteredPos[0].ranks && filteredPos[0].ranks.length > 0) {
              setNewRank(filteredPos[0].ranks[0]);
            } else {
              setNewRank('');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading structure data:', err);
    }
  };

  const handleDepartmentChange = (deptName: string) => {
    setNewDepartment(deptName);
    const deptObj = dbDepartments.find(d => d.name === deptName);
    const filtered = dbPositions.filter(p => p.departmentId === deptObj?.id);
    if (filtered.length > 0) {
      const firstPos = filtered[0];
      setNewPositionCode(firstPos.code);
      const roleObj = dbRoles.find(r => r.code === firstPos.roleCode);
      if (roleObj) {
        setNewRole(roleObj.systemRole);
      }
      if (firstPos.ranks && firstPos.ranks.length > 0) {
        setNewRank(firstPos.ranks[0]);
      } else {
        setNewRank('');
      }
    } else {
      setNewPositionCode('');
      setNewRole('employee');
      setNewRank('');
    }
  };

  const handleEditDepartmentChange = (deptName: string) => {
    setEditDepartment(deptName);
    const deptObj = dbDepartments.find(d => d.name === deptName);
    const filtered = dbPositions.filter(p => p.departmentId === deptObj?.id);
    if (filtered.length > 0) {
      const firstPos = filtered[0];
      setEditPositionCode(firstPos.code);
      const roleObj = dbRoles.find(r => r.code === firstPos.roleCode);
      if (roleObj) {
        setEditRole(roleObj.systemRole);
      }
      if (firstPos.ranks && firstPos.ranks.length > 0) {
        setEditRank(firstPos.ranks[0]);
      } else {
        setEditRank('');
      }
    } else {
      setEditPositionCode('');
      setEditRole('employee');
      setEditRank('');
    }
  };

  const handlePositionChange = (code: string) => {
    setNewPositionCode(code);
    const pos = dbPositions.find(p => p.code === code);
    if (pos) {
      const roleObj = dbRoles.find(r => r.code === pos.roleCode);
      if (roleObj) {
        setNewRole(roleObj.systemRole);
      }
      if (pos.ranks && pos.ranks.length > 0) {
        setNewRank(pos.ranks[0]);
      } else {
        setNewRank('');
      }
    } else {
      setNewRank('');
    }
  };

  const handleEditPositionChange = (code: string) => {
    setEditPositionCode(code);
    const pos = dbPositions.find(p => p.code === code);
    if (pos) {
      const roleObj = dbRoles.find(r => r.code === pos.roleCode);
      if (roleObj) {
        setEditRole(roleObj.systemRole);
      }
      if (pos.ranks && pos.ranks.length > 0) {
        setEditRank(pos.ranks[0]);
      } else {
        setEditRank('');
      }
    } else {
      setEditRank('');
    }
  };

  // --- CRUD Handlers for Departments ---
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsDeptSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newDeptName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbDepartments(prev => [...prev, data]);
      setNewDeptName('');
      setSuccessMsg('Подразделение успешно добавлено!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  const handleUpdateDept = async (id: string) => {
    if (!editingDeptName.trim()) return;
    setIsDeptSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editingDeptName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbDepartments(prev => prev.map(d => d.id === id ? data : d));
      setEditingDeptId(null);
      setSuccessMsg('Подразделение успешно обновлено!');
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbDepartments(prev => prev.filter(d => d.id !== id));
      setSuccessMsg('Подразделение успешно удалено!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- CRUD Handlers for Positions ---
  const handleCreatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosCode.trim() || !newPosName.trim() || !newPosDeptId || !newPosRoleCode) {
      setError('Заполните все поля формы');
      return;
    }
    setIsPosSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          code: newPosCode,
          name: newPosName,
          departmentId: newPosDeptId,
          roleCode: newPosRoleCode,
          ranks: []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbPositions(prev => [...prev, data]);
      setNewPosCode('');
      setNewPosName('');
      setNewPosDeptId('');
      setNewPosRoleCode('');
      setNewPosRanks('');
      setSuccessMsg('Должность успешно создана!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPosSubmitting(false);
    }
  };

  const handleUpdatePos = async (code: string) => {
    if (!editingPosName.trim() || !editingPosDeptId || !editingPosRoleCode) return;
    setIsPosSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const existingPos = dbPositions.find(p => p.code === code);
      const ranks = existingPos ? existingPos.ranks || [] : [];

      const res = await fetch(`/api/positions/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editingPosName,
          departmentId: editingPosDeptId,
          roleCode: editingPosRoleCode,
          ranks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbPositions(prev => prev.map(p => p.code === code ? data : p));
      setEditingPosCode(null);
      setEditingPosRanks('');
      setSuccessMsg('Должность успешно обновлена!');
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPosSubmitting(false);
    }
  };

  const handleDeletePos = async (code: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/positions/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbPositions(prev => prev.filter(p => p.code !== code));
      setSuccessMsg('Должность успешно удалена!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- CRUD Handlers for Roles ---
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode.trim() || !newRoleName.trim() || !newRoleSys) return;
    setIsRoleSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          code: newRoleCode,
          name: newRoleName,
          systemRole: newRoleSys
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbRoles(prev => [...prev, data]);
      setNewRoleCode('');
      setNewRoleName('');
      setNewRoleSys('employee');
      setSuccessMsg('Роль успешно создана!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const handleUpdateRole = async (code: string) => {
    if (!editingRoleName.trim() || !editingRoleSys) return;
    setIsRoleSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/roles/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: editingRoleName,
          systemRole: editingRoleSys
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbRoles(prev => prev.map(r => r.code === code ? data : r));
      setEditingRoleCodeState(null);
      setSuccessMsg('Роль успешно обновлена!');
      fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async (code: string) => {
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/roles/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDbRoles(prev => prev.filter(r => r.code !== code));
      setSuccessMsg('Роль успешно удалена!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- CRUD Handlers for Ranks ---
  const savePositionRanks = async (posCode: string, updatedRanks: string[], successMessage: string) => {
    const pos = dbPositions.find(p => p.code === posCode);
    if (!pos) return;

    setIsRankSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const res = await fetch(`/api/positions/${posCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: pos.name,
          departmentId: pos.departmentId,
          roleCode: pos.roleCode,
          ranks: updatedRanks
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения ранга');

      setDbPositions(prev => prev.map(p => p.code === posCode ? data : p));
      setSuccessMsg(successMessage);
      fetchEmployees(); // Reload employees list to catch any cascaded rank changes
      fetchCourses(); // Reload courses list to catch any cascaded rank changes
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRankSubmitting(false);
    }
  };

  const handleAddRankToPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRankPosCode) {
      setError('Выберите должность');
      return;
    }
    if (!newRankName.trim()) return;

    const pos = dbPositions.find(p => p.code === selectedRankPosCode);
    if (!pos) return;

    const currentRanks = pos.ranks || [];
    if (currentRanks.includes(newRankName.trim())) {
      setError('Такой ранг уже существует для этой должности');
      return;
    }

    const updatedRanks = [...currentRanks, newRankName.trim()];
    await savePositionRanks(selectedRankPosCode, updatedRanks, `Ранг "${newRankName.trim()}" успешно добавлен!`);
    setNewRankName('');
  };

  const handleUpdateRankOfPosition = async (rankIdx: number) => {
    if (!selectedRankPosCode) return;
    if (!editingRankNameValue.trim()) return;

    const pos = dbPositions.find(p => p.code === selectedRankPosCode);
    if (!pos) return;

    const updatedRanks = [...(pos.ranks || [])];
    const oldName = updatedRanks[rankIdx];
    if (oldName === editingRankNameValue.trim()) {
      setEditingRankIndex(null);
      return;
    }

    if (updatedRanks.includes(editingRankNameValue.trim()) && updatedRanks.indexOf(editingRankNameValue.trim()) !== rankIdx) {
      setError('Такой ранг уже существует для этой должности');
      return;
    }

    updatedRanks[rankIdx] = editingRankNameValue.trim();
    await savePositionRanks(selectedRankPosCode, updatedRanks, `Ранг успешно переименован в "${editingRankNameValue.trim()}"!`);
    setEditingRankIndex(null);
  };

  const handleDeleteRankFromPosition = async (rankIdx: number) => {
    if (!selectedRankPosCode) return;

    const pos = dbPositions.find(p => p.code === selectedRankPosCode);
    if (!pos) return;

    const currentRanks = pos.ranks || [];
    const rankToDelete = currentRanks[rankIdx];
    if (!window.confirm(`Вы уверены, что хотите удалить ранг "${rankToDelete}"? Это также сбросит ранг у сотрудников и курсов, привязанных к нему.`)) {
      return;
    }

    const updatedRanks = currentRanks.filter((_, idx) => idx !== rankIdx);
    await savePositionRanks(selectedRankPosCode, updatedRanks, `Ранг "${rankToDelete}" успешно удален!`);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      setError('Имя и Email обязательны');
      return;
    }

    setIsCreating(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const specializations = newSpecString
        ? newSpecString.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          department: newDepartment,
          bio: newBio,
          specializations,
          positionCode: newPositionCode,
          positionName: dbPositions.find(p => p.code === newPositionCode)?.name || '',
          role: newRole,
          rank: newRank
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании сотрудника');
      }

      // Add to list, reset form, show success message
      setEmployees(prev => [...prev, data.employee]);
      setSuccessMsg(`Сотрудник ${newName} успешно зарегистрирован. На его email отправлено приглашение!`);
      
      // Reset registration form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPositionCode('13');
      setNewDepartment('RetMind Support');
      setNewRole('employee');
      setNewBio('');
      setNewSpecString('');
      setNewRank('');
      setShowAddForm(false);
      
      // Refresh the invitation list in the email simulation
      refreshEmails();
      
      // Auto-open email simulator to show the new email!
      setShowEmailSimulator(true);
      if (data.simulatedEmail) {
        setSelectedEmail(data.simulatedEmail);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditInit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditPhone(emp.profile.phone || '');
    setEditDepartment(emp.profile.department || '');
    setEditBio(emp.profile.bio || '');
    setEditSpecString(emp.profile.specializations ? emp.profile.specializations.join(', ') : '');
    setEditPositionCode(emp.profile.positionCode || '13');
    setEditRole(emp.role || 'employee');
    setEditRank(emp.profile.rank || '');
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsUpdating(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const specializations = editSpecString
        ? editSpecString.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          department: editDepartment,
          bio: editBio,
          specializations,
          positionCode: editPositionCode,
          positionName: dbPositions.find(p => p.code === editPositionCode)?.name || '',
          role: editRole,
          rank: editRank
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при обновлении сотрудника');
      }

      // Update in UI list
      setEmployees(prev => prev.map(emp => emp.id === data.id ? data : emp));
      setSuccessMsg(`Профиль сотрудника ${editName} успешно обновлен!`);
      setEditingEmployee(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при удалении');
      }

      setEmployees(prev => prev.filter(emp => emp.id !== id));
      setSuccessMsg('Профиль сотрудника успешно удален из системы.');
      setDeletingId(null);
      refreshEmails();
    } catch (err: any) {
      setError(err.message);
      setDeletingId(null);
    }
  };

  const handleOpenEmailInOnboarding = (emailObj: SimulatedEmail) => {
    // Mark email as read in server
    fetch(`/api/emails/${emailObj.id}/read`, { method: 'POST' }).then(() => refreshEmails());
    setShowEmailSimulator(false);
    openEmailFromApp(emailObj.token);
  };

  // Counting metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const pendingEmployees = employees.filter(e => e.status === 'pending').length;

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-slate-50 text-slate-805 flex font-sans relative w-full overflow-x-hidden">
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-950 text-slate-300 h-screen sticky top-0 shrink-0 shadow-2xl select-none z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-900/80 bg-slate-950 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <img src="/retmind-logo.png" alt="Retmind" className="h-8 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="text-[9px] font-bold text-[#C9B87A] uppercase tracking-[0.14em]">
            Senior IT & Retail Solutions
          </span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard (Home) */}
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Панель управления</span>
          </button>

          {/* Employees */}
          <button
            onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'employees'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Сотрудники</span>
          </button>

          {/* Structure */}
          <button
            onClick={() => { setActiveTab('structure'); setMobileMenuOpen(false); }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'structure'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Структура компании</span>
          </button>

          {/* Courses */}
          <button
            onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>Курсы обучения</span>
          </button>

          {/* Attestation */}
          <button
            id="attestation-tab-btn"
            onClick={() => {
              setActiveTab('attestation');
              setMobileMenuOpen(false);
              fetchGrades();
            }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'attestation'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Аттестация</span>
          </button>

          {/* Ticket Academy */}
          <button
            id="tickets-tab-btn"
            onClick={() => {
              setActiveTab('tickets');
              setMobileMenuOpen(false);
              fetchTickets();
            }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TicketIcon className="w-4.5 h-4.5" />
            <span>Ticket Academy</span>
          </button>

          {/* Reports & Analytics */}
          <button
            id="reports-tab-btn"
            onClick={() => {
              setActiveTab('reports');
              setMobileMenuOpen(false);
              fetchTickets(); // Ensure we load latest tickets for the report
            }}
            className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Отчетность и SLA</span>
          </button>
        </nav>

        {/* Sidebar Footer / Admin Account Info */}
        <div className="p-4 border-t border-slate-900 space-y-3.5">
          <button
            id="toggle-email-sim"
            onClick={() => {
              setShowEmailSimulator(true);
              refreshEmails();
            }}
            className="w-full relative px-4 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Почтовый сервер</span>
            </div>
            {simulatedEmails.filter(e => e.status === 'sent').length > 0 && (
              <span className="h-4 min-w-4 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-md">
                {simulatedEmails.filter(e => e.status === 'sent').length}
              </span>
            )}
          </button>

          <div className="flex items-center justify-between gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-900/55">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-indigo-500/20">
                {adminUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-extrabold text-white truncate leading-snug">{adminUser.name}</div>
                <div className="text-[8px] text-slate-400 font-mono truncate leading-none mt-0.5">{adminUser.email}</div>
              </div>
            </div>
            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer shrink-0"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKING AREA WRAPPER */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* MOBILE HEADER */}
        <header className="lg:hidden bg-white border-b border-slate-200 py-3 px-4 sticky top-0 z-40 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <img src="/retmind-logo.png" alt="Retmind" className="h-7 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowEmailSimulator(true);
                refreshEmails();
              }}
              className="relative p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all"
            >
              <Inbox className="w-4.5 h-4.5 text-indigo-600" />
              {simulatedEmails.filter(e => e.status === 'sent').length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold text-white">
                  {simulatedEmails.filter(e => e.status === 'sent').length}
                </span>
              )}
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MOBILE MENU DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden backdrop-blur-xs"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col lg:hidden"
              >
                {/* Brand Header */}
                <div className="p-4 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h1 className="font-extrabold tracking-tight text-xs text-slate-900 uppercase">Support Learning</h1>
                      <div className="text-[8px] text-indigo-600 uppercase tracking-widest font-extrabold">Администратор</div>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sidebar Nav Items */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'dashboard'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Панель управления</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'employees'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Сотрудники</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('structure'); setMobileMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'structure'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Структура компании</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('courses'); setMobileMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'courses'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Курсы обучения</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('attestation'); setMobileMenuOpen(false); fetchGrades(); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'attestation'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Аттестация</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('tickets'); setMobileMenuOpen(false); fetchTickets(); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'tickets'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <TicketIcon className="w-4 h-4" />
                    <span>Ticket Academy</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); fetchTickets(); }}
                    className={`w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-3 ${
                      activeTab === 'reports'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Отчетность и SLA</span>
                  </button>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-150 space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0">
                      {adminUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] font-bold text-slate-800 truncate">{adminUser.name}</div>
                      <div className="text-[8px] text-slate-455 truncate font-mono">{adminUser.email}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN WORKING CANVAS */}
        <main className="flex-1 py-6 px-4 md:px-8 space-y-6 overflow-y-auto w-full max-w-7xl mx-auto">
          {/* Top Banner on Desktop */}
          <div className="hidden lg:flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Support Learning</h2>
              <p className="text-xs text-slate-455 mt-0.5">Внутренняя система адаптации, курсов и аттестации сотрудников</p>
            </div>
          </div>

          {/* Dashboard Tab Content */}
          {activeTab === 'dashboard' && (() => {
            const now = new Date(); // In July 2026
            const curYear = now.getFullYear();
            const curMonth = now.getMonth();

            // Filter tickets based on timeframe (current month, quarter, year, or all)
            const dashTickets = tickets.filter(t => {
              const tDate = new Date(t.createdAt);
              if (dashTimeframe === 'month') {
                return tDate.getFullYear() === curYear && tDate.getMonth() === curMonth;
              }
              if (dashTimeframe === 'quarter') {
                const currentQuarter = Math.floor(curMonth / 3);
                const tQuarter = Math.floor(tDate.getMonth() / 3);
                return tDate.getFullYear() === curYear && tQuarter === currentQuarter;
              }
              if (dashTimeframe === 'year') {
                return tDate.getFullYear() === curYear;
              }
              return true;
            });

            // Group by clients
            const clientCounts = dashTickets.reduce((acc, t) => {
              const name = t.client || 'Не указан';
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const COLORS_PALETTE = [
              '#4f46e5', // Indigo
              '#10b981', // Emerald
              '#f59e0b', // Amber
              '#8b5cf6', // Purple
              '#f43f5e', // Rose
              '#0d9488', // Teal
              '#0284c7', // Sky
              '#ea580c', // Orange
              '#7c3aed', // Violet
              '#db2777'  // Pink
            ];

            const clientPieData = Object.entries(clientCounts).map(([label, value], idx) => ({
              id: label,
              label,
              value: value as number,
              color: COLORS_PALETTE[idx % COLORS_PALETTE.length]
            })).sort((a, b) => b.value - a.value);

            // Group by modules
            const moduleCounts = dashTickets.reduce((acc, t) => {
              const name = t.module || 'Другое';
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const modulePieData = Object.entries(moduleCounts).map(([label, value], idx) => ({
              id: label,
              label,
              value: value as number,
              color: COLORS_PALETTE[(idx + 4) % COLORS_PALETTE.length]
            })).sort((a, b) => b.value - a.value);

            // Group by systems
            const systemCounts = dashTickets.reduce((acc, t) => {
              const name = t.system || 'Другое';
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const systemPieData = Object.entries(systemCounts).map(([label, value], idx) => ({
              id: label,
              label,
              value: value as number,
              color: COLORS_PALETTE[(idx + 8) % COLORS_PALETTE.length]
            })).sort((a, b) => b.value - a.value);

            // Calculate metrics
            const totalCount = dashTickets.length;
            const openCount = dashTickets.filter(t => t.status === 'open').length;
            const resolvedCount = dashTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

            const resolvedOrClosed = dashTickets.filter(t => t.status === 'resolved' || t.status === 'closed');
            const resolutionHours = resolvedOrClosed.map(t => {
              const end = t.closedAt ? new Date(t.closedAt) : (t.resolvedAt ? new Date(t.resolvedAt) : null);
              if (!end) return null;
              const start = new Date(t.createdAt);
              const diff = end.getTime() - start.getTime();
              return diff > 0 ? diff / (1000 * 60 * 60) : 0;
            }).filter((v): v is number => v !== null);

            const avgTime = resolutionHours.length > 0
              ? resolutionHours.reduce((sum, v) => sum + v, 0) / resolutionHours.length
              : 0;

            const formatDuration = (hours: number): string => {
              if (hours <= 0) return '—';
              if (hours < 1) {
                const mins = Math.round(hours * 60);
                return `${mins} мин`;
              }
              const wholeHours = Math.floor(hours);
              const mins = Math.round((hours - wholeHours) * 60);
              return mins === 0 ? `${wholeHours} ч` : `${wholeHours} ч ${mins} мин`;
            };

             // Display tickets (filtered by selected pie slices)
             const displayTickets = dashTickets.filter(t => {
               if (dashSelectedClient && t.client !== dashSelectedClient) return false;
               if (dashSelectedModule && t.module !== dashSelectedModule) return false;
               if (dashSelectedSystem && t.system !== dashSelectedSystem) return false;
               return true;
             });
 
             return (
               <div className="space-y-6">
                 {/* Modern Dynamic Welcome Header */}
                 <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 md:p-8 rounded-3xl text-white relative overflow-hidden shadow-lg shadow-indigo-950/10 border border-indigo-900/40">
                   <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                   <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20" />
                   
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-2">
                       <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">
                         Панель Управления Аналитики
                       </span>
                       <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1.5">
                         Анализ обращений клиентов поддержки RetMind
                       </h2>
                       <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                         Визуальные отчеты распределения тикетов, сравнительный анализ по брендам, модулям и системам. Нажмите на сектора графиков для детальной фильтрации списка тикетов ниже.
                       </p>
                     </div>
 
                     {/* Timeframe Switcher */}
                     <div className="shrink-0 flex flex-wrap items-center bg-slate-850 p-1.5 rounded-2xl border border-slate-700/50 gap-1">
                       <button
                         onClick={() => {
                           setDashTimeframe('month');
                           setDashSelectedClient(null);
                           setDashSelectedModule(null);
                           setDashSelectedSystem(null);
                         }}
                         className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                           dashTimeframe === 'month'
                             ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                             : 'text-slate-400 hover:text-white'
                         }`}
                       >
                         Месяц
                       </button>
                       <button
                         onClick={() => {
                           setDashTimeframe('quarter');
                           setDashSelectedClient(null);
                           setDashSelectedModule(null);
                           setDashSelectedSystem(null);
                         }}
                         className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                           dashTimeframe === 'quarter'
                             ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                             : 'text-slate-400 hover:text-white'
                         }`}
                       >
                         Квартал
                       </button>
                       <button
                         onClick={() => {
                           setDashTimeframe('year');
                           setDashSelectedClient(null);
                           setDashSelectedModule(null);
                           setDashSelectedSystem(null);
                         }}
                         className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                           dashTimeframe === 'year'
                             ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                             : 'text-slate-400 hover:text-white'
                         }`}
                       >
                         Год
                       </button>
                       <button
                         onClick={() => {
                           setDashTimeframe('all');
                           setDashSelectedClient(null);
                           setDashSelectedModule(null);
                           setDashSelectedSystem(null);
                         }}
                         className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                           dashTimeframe === 'all'
                             ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                             : 'text-slate-400 hover:text-white'
                         }`}
                       >
                         Все время
                       </button>
                     </div>
                   </div>
                 </div>

                {/* Attestation Notifications Alert Block */}
                {(() => {
                  const alerts = getUpcomingAttestations();
                  if (alerts.length === 0) return null;

                  return (
                    <div className="bg-amber-50/40 border border-amber-200/80 p-5 md:p-6 rounded-3xl space-y-4 shadow-xs mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500 text-white rounded-2xl shadow-xs">
                          <Bell className="w-4 h-4 animate-bounce" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-amber-900">🔔 Оповещения об аттестации сотрудников</h3>
                          <p className="text-[11px] text-amber-700/85">Сотрудники, которые завершили обучение или у которых подходит срок аттестации</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.map((alert, idx) => {
                          const isOverdue = alert.status === 'exam_overdue';
                          const isNearEnd = alert.status === 'learning_near_end';
                          
                          return (
                            <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                              isOverdue 
                                ? 'bg-rose-50/60 border-rose-100 text-rose-950' 
                                : isNearEnd
                                ? 'bg-indigo-50/40 border-indigo-100 text-indigo-950'
                                : 'bg-white border-amber-100/80 text-amber-950 shadow-2xs'
                            }`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isOverdue 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : isNearEnd
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {alert.employeeName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <strong className="text-xs font-bold block truncate">{alert.employeeName}</strong>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                    isOverdue 
                                      ? 'bg-rose-100 text-rose-700' 
                                      : isNearEnd
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {isOverdue ? 'Просрочено' : isNearEnd ? 'Срок на исходе' : 'Назначить аттестацию'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-550 line-clamp-1">Курс: <span className="font-semibold text-slate-700">{alert.courseTitle}</span></p>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span>Начало: {new Date(alert.startedAt).toLocaleDateString('ru-RU')}</span>
                                  <span>•</span>
                                  <span>Прошло дней: {alert.daysElapsed} из {alert.studyDurationDays}</span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">
                                  {isOverdue 
                                    ? `Аттестация должна была пройти до ${alert.deadlineDate.toLocaleDateString('ru-RU')}`
                                    : `Рекомендуемый срок аттестации: до ${alert.deadlineDate.toLocaleDateString('ru-RU')}`
                                  }
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Dashboard Summary Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Total tickets in timeframe */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <TicketIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Обращений за период</span>
                      <span className="block text-2xl font-black text-slate-800 tracking-tight mt-0.5">{totalCount} шт.</span>
                    </div>
                  </div>

                  {/* Card 2: Open/Active tickets */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">В обработке</span>
                      <span className="block text-2xl font-black text-slate-800 tracking-tight mt-0.5">{openCount} шт.</span>
                    </div>
                  </div>

                  {/* Card 3: Resolved tickets */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Решено / Закрыто</span>
                      <span className="block text-2xl font-black text-slate-800 tracking-tight mt-0.5">{resolvedCount} шт.</span>
                    </div>
                  </div>

                  {/* Card 4: Avg Resolution Time */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ср. время закрытия</span>
                      <span className="block text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                        {avgTime > 0 ? formatDuration(avgTime) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analytical Charts Bento Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Clients Pie Chart */}
                  <InteractivePieChart
                    title="Распределение тикетов по Клиентам"
                    subtitle={
                      dashTimeframe === 'month' ? 'Сравнение объема обращений брендов в Июле 2026' :
                      dashTimeframe === 'quarter' ? 'Сравнение объема обращений брендов за текущий квартал' :
                      dashTimeframe === 'year' ? 'Сравнение объема обращений брендов за текущий год' :
                      'Сравнение объема обращений брендов за все время'
                    }
                    data={clientPieData}
                    selectedId={dashSelectedClient}
                    onSelectSlice={(id) => setDashSelectedClient(id)}
                    emptyMessage="Нет данных по клиентам за выбранный период"
                  />

                  {/* Chart 2: Systems Pie Chart */}
                  <InteractivePieChart
                    title="Распределение тикетов по Системам"
                    subtitle={
                      dashTimeframe === 'month' ? 'Обращения по информационным системам в Июле 2026' :
                      dashTimeframe === 'quarter' ? 'Обращения по информационным системам за текущий квартал' :
                      dashTimeframe === 'year' ? 'Обращения по информационным системам за текущий год' :
                      'Обращения по информационным системам за все время'
                    }
                    data={systemPieData}
                    selectedId={dashSelectedSystem}
                    onSelectSlice={(id) => setDashSelectedSystem(id)}
                    emptyMessage="Нет данных по системам за выбранный период"
                  />

                  {/* Chart 3: Modules Pie Chart */}
                  <InteractivePieChart
                    title="Распределение тикетов по Модулям"
                    subtitle={
                      dashTimeframe === 'month' ? 'Инциденты по функциональным модулям в Июле 2026' :
                      dashTimeframe === 'quarter' ? 'Инциденты по функциональным модулям за текущий квартал' :
                      dashTimeframe === 'year' ? 'Инциденты по функциональным модулям за текущий год' :
                      'Инциденты по функциональным модулям за все время'
                    }
                    data={modulePieData}
                    selectedId={dashSelectedModule}
                    onSelectSlice={(id) => setDashSelectedModule(id)}
                    emptyMessage="Нет данных по модулям за выбранный период"
                  />
                </div>

                {/* Ticket Explorer / List matching selections */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-6 border-b border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Тикеты в выбранном срезе</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                        Найдено <span className="text-indigo-600 font-bold font-mono">{displayTickets.length}</span> из <span className="font-mono">{totalCount}</span>
                      </p>
                    </div>

                    {/* Active Filters Display */}
                    {(dashSelectedClient || dashSelectedModule || dashSelectedSystem) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {dashSelectedClient && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg">
                            <span>Клиент: {dashSelectedClient}</span>
                            <button onClick={() => setDashSelectedClient(null)} className="hover:text-indigo-950 font-black cursor-pointer">×</button>
                          </span>
                        )}
                        {dashSelectedModule && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold rounded-lg">
                            <span>Модуль: {dashSelectedModule}</span>
                            <button onClick={() => setDashSelectedModule(null)} className="hover:text-purple-950 font-black cursor-pointer">×</button>
                          </span>
                        )}
                        {dashSelectedSystem && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-100 text-sky-700 text-[10px] font-bold rounded-lg">
                            <span>Система: {dashSelectedSystem}</span>
                            <button onClick={() => setDashSelectedSystem(null)} className="hover:text-sky-950 font-black cursor-pointer">×</button>
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setDashSelectedClient(null);
                            setDashSelectedModule(null);
                            setDashSelectedSystem(null);
                          }}
                          className="text-[10px] font-bold text-slate-455 hover:text-slate-800 hover:underline cursor-pointer"
                        >
                          Сбросить всё
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4 w-20">ID</th>
                          <th className="p-4">Бренд / Клиент</th>
                          <th className="p-4">Тема обращения</th>
                          <th className="p-4">Категория / Модуль</th>
                          <th className="p-4">Дата создания</th>
                          <th className="p-4">Исполнитель</th>
                          <th className="p-4 text-right">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {displayTickets.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/20 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-400 text-[10px]">#{t.id}</td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-slate-200/40">
                                {t.client || '—'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-900 max-w-xs truncate" title={t.subject}>{t.subject || 'Без темы'}</p>
                              <p className="text-[10px] text-slate-400 font-medium max-w-xs truncate mt-0.5">{t.description}</p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                  {t.system || 'SYS'}
                                </span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-600 text-[10px] font-bold">{t.module || 'Другое'}</span>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                              {new Date(t.createdAt).toLocaleDateString('ru-RU')}
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                                {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="p-4">
                              {t.assignedToName ? (
                                <span className="font-bold text-slate-800">{t.assignedToName}</span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">Не назначен</span>
                              )}
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                t.status === 'open' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : t.status === 'resolved'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {t.status === 'open' ? 'В работе' : (t.status === 'resolved' ? 'Решен' : 'Закрыт')}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {displayTickets.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                              Тикеты в выбранном разрезе фильтрации отсутствуют
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* end of dashboard */}

          {activeTab === 'employees' && (
          <div className="space-y-6">
            {/* Top Actions: Add User button */}
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Список сотрудников поддержки</h2>
              <button
                id="register-new-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{showAddForm ? 'Закрыть форму' : 'Регистрация нового сотрудника'}</span>
              </button>
            </div>

            {/* Onboarding Register Form Dropdown */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden"
                >
                  <form onSubmit={handleCreateEmployee} className="p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Заполнить анкету нового сотрудника</h3>
                      </div>
                      <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Имя и фамилия *</label>
                        <input
                          id="new-employee-name"
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Dmitry Volkov"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Электронная почта *</label>
                        <input
                          id="new-employee-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="dmitry@company.com"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Подразделение *</label>
                        <select
                          id="new-employee-dept"
                          value={newDepartment}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium text-slate-800"
                        >
                          {dbDepartments.map(dept => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Должность в компании *</label>
                        <select
                          id="new-employee-pos"
                          value={newPositionCode}
                          onChange={(e) => handlePositionChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium text-slate-800"
                        >
                          {dbPositions.filter(pos => {
                            const currentDept = dbDepartments.find(d => d.name === newDepartment);
                            return pos.departmentId === currentDept?.id;
                          }).map(pos => (
                            <option key={pos.code} value={pos.code}>
                              [{pos.code}] {pos.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Контактный телефон (необязательно)</label>
                        <input
                          id="new-employee-phone"
                          type="text"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="+7 (999) 123-45-67"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Роль в системе (автоопределение)</label>
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200/50 rounded-xl text-sm text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${
                            newRole === 'admin' ? 'bg-red-500' :
                            newRole === 'manager' ? 'bg-indigo-500' :
                            'bg-slate-400'
                          }`} />
                          <span className="font-bold">
                            {newRole === 'admin' ? 'Администратор (Полный доступ)' :
                             newRole === 'manager' ? 'Менеджер (Доступ к управлению)' :
                             'Сотрудник (Личный кабинет)'}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const selectedPositionObj = dbPositions.find(p => p.code === newPositionCode);
                        if (selectedPositionObj?.ranks && selectedPositionObj.ranks.length > 0) {
                          return (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ранг в должности *</label>
                              <select
                                id="new-employee-rank"
                                value={newRank}
                                onChange={(e) => setNewRank(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer font-medium text-slate-800"
                                required
                              >
                                <option value="">Выберите ранг</option>
                                {selectedPositionObj.ranks.map((rankOpt) => (
                                  <option key={rankOpt} value={rankOpt}>
                                    {rankOpt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Специализации (через запятую)</label>
                      <input
                        id="new-employee-specs"
                        type="text"
                        value={newSpecString}
                        onChange={(e) => setNewSpecString(e.target.value)}
                        placeholder="Linux, Биллинг, SQL, API, Гарантия"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Краткая информация / Биография</label>
                      <textarea
                        id="new-employee-bio"
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Напишите кратко о квалификации или роли нового сотрудника..."
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        id="submit-register-btn"
                        type="submit"
                        disabled={isCreating}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {isCreating ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            Создать аккаунт и отправить приглашение
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: List with sorting & filtering */}
              <div className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${mobileViewingDetails ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Header and Filters Area */}
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Фильтры и Поиск</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Найдено: {filteredAndSortedEmployees.length}
                    </span>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Поиск по имени, роли, должности..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    {employeeSearchQuery && (
                      <button 
                        onClick={() => setEmployeeSearchQuery('')} 
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Dropdowns Filters */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={employeeFilterDepartment}
                      onChange={(e) => setEmployeeFilterDepartment(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                    >
                      <option value="all">Все отделы</option>
                      {dbDepartments.map(dept => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={employeeFilterStatus}
                      onChange={(e) => setEmployeeFilterStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                    >
                      <option value="all">Все статусы</option>
                      <option value="active">Активные</option>
                      <option value="pending">В ожидании</option>
                    </select>
                  </div>
                </div>

                {/* Employees List */}
                <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-100">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                      <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] font-medium">Загрузка списка...</span>
                    </div>
                  ) : filteredAndSortedEmployees.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-[10px]">Ничего не найдено</p>
                      <p className="text-[11px] text-slate-450 mt-1">Попробуйте изменить параметры фильтрации</p>
                    </div>
                  ) : (
                    filteredAndSortedEmployees.map((emp) => {
                      const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                      const isSelected = emp.id === selectedEmployeeId;
                      const isPending = emp.status === 'pending';

                      return (
                        <button
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setMobileViewingDetails(true);
                          }}
                          className={`w-full text-left p-4 transition-all flex items-center gap-3 border-l-4 cursor-pointer hover:bg-slate-50/50 ${
                            isSelected 
                              ? 'bg-indigo-50/40 border-indigo-600' 
                              : 'border-transparent'
                          }`}
                        >
                          {/* Initials Avatar */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold tracking-wider text-xs border shrink-0 ${
                            isSelected 
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                              : isPending 
                              ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {initials}
                          </div>

                          {/* Basic Info */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                              {emp.name}
                              {emp.id === adminUser.id && (
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase tracking-wider">Вы</span>
                              )}
                            </h4>
                            <p className="text-[10px] text-indigo-600 font-semibold truncate leading-tight">
                              {emp.profile.positionName || 'Специалист'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                              {emp.profile.department || 'RetMind Support'}
                            </p>
                          </div>

                          {/* Small Status indicator */}
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest">{emp.role === 'admin' ? 'Админ' : emp.role === 'manager' ? 'Мендж' : 'Сотр'}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed View */}
              <div className={`lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6 overflow-hidden ${!mobileViewingDetails ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Mobile Back Button */}
                <div className="lg:hidden flex items-center mb-2">
                  <button
                    onClick={() => setMobileViewingDetails(false)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all"
                  >
                    ← К списку сотрудников
                  </button>
                </div>

                {(() => {
                  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
                  if (!selectedEmp) {
                    return (
                      <div className="text-center py-20">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Сотрудник не выбран</h3>
                        <p className="text-xs text-slate-400 mt-2">Выберите сотрудника из списка слева для просмотра полной информации.</p>
                      </div>
                    );
                  }

                  const initials = selectedEmp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const isPending = selectedEmp.status === 'pending';
                  
                  // Compute Assigned Courses
                  const empCourses = courses.filter(course => {
                    if (course.positionCode === selectedEmp.profile.positionCode) {
                      if (!course.rank || course.rank === selectedEmp.profile.rank) return true;
                    }
                    if (course.bindings && course.bindings.length > 0) {
                      return course.bindings.some(b => 
                        b.positionCode === selectedEmp.profile.positionCode && 
                        (!b.rank || b.rank === selectedEmp.profile.rank)
                      );
                    }
                    return false;
                  });

                  return (
                    <div className="space-y-6">
                      {/* Top Header Card of Detail Panel */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        
                        {/* Profile Info Row */}
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold tracking-wider text-xl border shrink-0 ${
                            isPending 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {initials}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                                {selectedEmp.name}
                              </h3>
                              <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                                selectedEmp.role === 'admin'
                                  ? 'bg-red-50 text-red-700 border-red-200/40'
                                  : selectedEmp.role === 'manager'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200/40'
                                  : 'bg-slate-50 text-slate-500 border-slate-200/40'
                              }`}>
                                {selectedEmp.role === 'admin' ? 'Администратор' : selectedEmp.role === 'manager' ? 'Менеджер' : 'Сотрудник'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                                isPending 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-250/30'
                              }`}>
                                {isPending ? 'В ожидании' : 'Активен'}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-indigo-600 flex items-center flex-wrap gap-1 leading-none">
                              <span>{selectedEmp.profile.positionName || 'Специалист'} ({selectedEmp.profile.positionCode || '—'})</span>
                              {selectedEmp.profile.rank && (
                                <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded border border-teal-150 text-[9px] font-bold leading-none">
                                  {selectedEmp.profile.rank}
                                </span>
                              )}
                            </p>

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none pt-0.5">
                              {selectedEmp.profile.department || 'Без отдела'}
                            </p>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
                          {isPending && (
                            <button
                              onClick={() => {
                                const emailObj = simulatedEmails.find(m => m.to.toLowerCase() === selectedEmp.email.toLowerCase());
                                if (emailObj) {
                                  handleOpenEmailInOnboarding(emailObj);
                                } else {
                                  alert('Письмо-приглашение не найдено. Пожалуйста, откройте вкладку «Почтовый сервер» для просмотра ссылок.');
                                }
                              }}
                              className="px-3 py-1.5 text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                              title="Активировать аккаунт сотрудника"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Активация</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditInit(selectedEmp)}
                            className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer text-xs font-bold text-slate-655 flex items-center gap-1.5"
                            title="Редактировать сотрудника"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Редактировать</span>
                          </button>

                          <button
                            onClick={() => setDeletingId(selectedEmp.id)}
                            className="p-2 border border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
                            title="Удалить сотрудника"
                            disabled={selectedEmp.id === adminUser.id}
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${selectedEmp.id === adminUser.id ? 'opacity-30' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Info & Onboarding Tabs split inside Details Panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        
                        {/* Contact details & Bio */}
                        <div className="space-y-4 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">Личные & Контактные данные</h4>
                          
                          <div className="space-y-3.5 text-xs text-slate-650">
                            <div className="flex items-center gap-2.5">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <span className="font-mono text-slate-700">{selectedEmp.email}</span>
                            </div>

                            {selectedEmp.profile.phone && (
                              <div className="flex items-center gap-2.5">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="font-mono text-slate-700">{selectedEmp.profile.phone}</span>
                              </div>
                            )}

                            <div className="flex items-start gap-2.5">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">Регистрация</p>
                                <p className="text-slate-700 font-medium mt-0.5">{new Date(selectedEmp.createdAt).toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5 pt-1 border-t border-slate-150">
                              <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none mb-1">О себе / Биография</p>
                                <p className="text-slate-600 leading-relaxed italic text-[11px]">
                                  {selectedEmp.profile.bio || 'Информации о сотруднике пока нет.'}
                                </p>
                              </div>
                            </div>

                            {/* Tags */}
                            {selectedEmp.profile.specializations && selectedEmp.profile.specializations.length > 0 && (
                              <div className="pt-2 border-t border-slate-150">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none mb-2">Специализации</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedEmp.profile.specializations.map((spec, sidx) => (
                                    <span key={sidx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-slate-200 text-slate-650 rounded-lg text-[9px] font-bold font-mono uppercase tracking-tight shadow-2xs">
                                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                                      {spec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Learning & Onboarding Progress */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">План Обучения & Аттестация</h4>
                          
                          {empCourses.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-500">Курсы не назначены</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Нет активных курсов для должности "{selectedEmp.profile.positionName || 'Специалист'}" с рангом "{selectedEmp.profile.rank || '—'}".
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                              {empCourses.map((course) => {
                                const courseGrades = grades.filter(g => g.employeeId === selectedEmp.id && g.courseId === course.id);
                                const totalLessons = course.lessons ? course.lessons.length : 0;
                                const completedLessons = courseGrades.length;
                                const pct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

                                return (
                                  <div key={course.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 hover:border-slate-300 transition-all">
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-slate-800 text-xs leading-snug">
                                        {course.title}
                                      </h5>
                                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span>Прогресс обучения</span>
                                        <span className="text-indigo-600">{completedLessons} из {totalLessons} уроков ({pct}%)</span>
                                      </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>

                                    {/* Lessons list details */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                                      {course.lessons && course.lessons.map((lesson, idx) => {
                                        const gradeObj = courseGrades.find(g => g.lessonId === lesson.id);
                                        return (
                                          <div key={lesson.id} className="flex justify-between items-start gap-2 text-[11px] py-1">
                                            <div className="min-w-0">
                                              <p className="font-semibold text-slate-700 truncate">
                                                {idx + 1}. {lesson.topic}
                                              </p>
                                              {gradeObj?.comment && (
                                                <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight line-clamp-1">
                                                  «{gradeObj.comment}»
                                                </p>
                                              )}
                                            </div>

                                            {gradeObj ? (
                                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-750 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 shadow-2xs">
                                                Оценка: {gradeObj.score}/10
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 border border-slate-100">
                                                Не пройден
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

        {activeTab === 'structure' && (
          <div className="space-y-6">
            {/* Structure Top Navigation / Sub-tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-xl gap-1">
              <button
                type="button"
                onClick={() => setStructureSubTab('departments')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  structureSubTab === 'departments'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Подразделения ({dbDepartments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStructureSubTab('positions')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  structureSubTab === 'positions'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Должности ({dbPositions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStructureSubTab('roles')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  structureSubTab === 'roles'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Роли ({dbRoles.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStructureSubTab('ranks')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  structureSubTab === 'ranks'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Ранги</span>
              </button>
            </div>

            {/* Sub-tab 1: DEPARTMENTS */}
            {structureSubTab === 'departments' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Create Department Form Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Добавить подразделение</h3>
                  </div>
                  <form onSubmit={handleCreateDept} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название подразделения *</label>
                      <input
                        type="text"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. RetMind Support Tier 3"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isDeptSubmitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isDeptSubmitting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Создать</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Departments List Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Список зарегистрированных подразделений</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-3">ID подразд.</th>
                          <th className="px-6 py-3">Название</th>
                          <th className="px-6 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dbDepartments.map((dept) => (
                          <tr key={dept.id} className="hover:bg-slate-50/30 transition-all">
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{dept.id}</td>
                            <td className="px-6 py-3.5 font-medium">
                              {editingDeptId === dept.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingDeptName}
                                    onChange={(e) => setEditingDeptName(e.target.value)}
                                    className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500/30"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDept(dept.id)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer"
                                    title="Сохранить"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingDeptId(null)}
                                    className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                                    title="Отмена"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span>{dept.name}</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingDeptId(dept.id);
                                    setEditingDeptName(dept.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Вы уверены, что хотите удалить подразделение "${dept.name}"? Это также может повлечь удаление связанных должностей.`)) {
                                      handleDeleteDept(dept.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: POSITIONS */}
            {structureSubTab === 'positions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Create Position Form Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Добавить должность</h3>
                  </div>
                  <form onSubmit={handleCreatePos} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Код должности * (числовой)</label>
                      <input
                        type="text"
                        value={newPosCode}
                        onChange={(e) => setNewPosCode(e.target.value)}
                        placeholder="e.g. 16"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название должности *</label>
                      <input
                        type="text"
                        value={newPosName}
                        onChange={(e) => setNewPosName(e.target.value)}
                        placeholder="e.g. Senior Trade Specialist"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Подразделение *</label>
                      <select
                        value={newPosDeptId}
                        onChange={(e) => setNewPosDeptId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800 font-medium"
                        required
                      >
                        <option value="">Выберите подразделение</option>
                        {dbDepartments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Роль по умолчанию *</label>
                      <select
                        value={newPosRoleCode}
                        onChange={(e) => setNewPosRoleCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800 font-medium"
                        required
                      >
                        <option value="">Выберите роль</option>
                        {dbRoles.map(r => (
                          <option key={r.code} value={r.code}>{r.name} ({r.systemRole === 'admin' ? 'Менеджер' : 'Сотрудник'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Ранги должности</span>
                      <p className="leading-relaxed">
                        Ранги больше не вводятся вручную строкой. Управляйте ими во вкладке{' '}
                        <button
                          type="button"
                          onClick={() => setStructureSubTab('ranks')}
                          className="text-indigo-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                        >
                          «Ранги»
                        </button>
                        . После создания должности вы сможете добавить к ней любые ранги там.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isPosSubmitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isPosSubmitting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Создать должность</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Positions List Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Список зарегистрированных должностей</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-3">Код</th>
                          <th className="px-6 py-3">Название</th>
                          <th className="px-6 py-3">Подразделение</th>
                          <th className="px-6 py-3">Роль по умолчанию</th>
                          <th className="px-6 py-3">Ранги</th>
                          <th className="px-6 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dbPositions.map((pos) => {
                          const dept = dbDepartments.find(d => d.id === pos.departmentId);
                          const role = dbRoles.find(r => r.code === pos.roleCode);

                          return (
                            <tr key={pos.code} className="hover:bg-slate-50/30 transition-all">
                              <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-500">{pos.code}</td>
                              <td className="px-6 py-3.5 font-medium">
                                {editingPosCode === pos.code ? (
                                  <input
                                    type="text"
                                    value={editingPosName}
                                    onChange={(e) => setEditingPosName(e.target.value)}
                                    className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500/30"
                                  />
                                ) : (
                                  <span>{pos.name}</span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-500 font-medium">
                                {editingPosCode === pos.code ? (
                                  <select
                                    value={editingPosDeptId}
                                    onChange={(e) => setEditingPosDeptId(e.target.value)}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  >
                                    {dbDepartments.map(d => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span>{dept ? dept.name : 'N/A'}</span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs">
                                {editingPosCode === pos.code ? (
                                  <select
                                    value={editingPosRoleCode}
                                    onChange={(e) => setEditingPosRoleCode(e.target.value)}
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  >
                                    {dbRoles.map(r => (
                                      <option key={r.code} value={r.code}>{r.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border ${
                                    role?.systemRole === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                                    role?.systemRole === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                    'bg-slate-100 text-slate-600 border border-slate-200/50'
                                  }`}>
                                    {role ? role.name : 'N/A'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-xs max-w-[200px]">
                                {pos.ranks && pos.ranks.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {pos.ranks.map((r, rIdx) => (
                                      <span key={rIdx} className="px-1.5 py-0.5 bg-indigo-50/85 border border-indigo-100/30 text-indigo-650 rounded-md text-[9px] font-bold uppercase tracking-wide">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">Нет рангов</span>
                                )}
                                {editingPosCode === pos.code && (
                                  <div className="mt-1.5 text-[10px] text-slate-400 leading-snug">
                                    Для настройки перейдите в вкладку{' '}
                                    <button
                                      type="button"
                                      onClick={() => setStructureSubTab('ranks')}
                                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                                    >
                                      «Ранги»
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                {editingPosCode === pos.code ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePos(pos.code)}
                                      className="p-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 cursor-pointer"
                                      title="Сохранить"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPosCode(null)}
                                      className="p-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer"
                                      title="Отмена"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPosCode(pos.code);
                                        setEditingPosName(pos.name);
                                        setEditingPosDeptId(pos.departmentId);
                                        setEditingPosRoleCode(pos.roleCode);
                                        setEditingPosRanks(pos.ranks ? pos.ranks.join(', ') : '');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                      title="Редактировать"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Вы уверены, что хотите удалить должность "${pos.name}"? Это сбросит должность у сотрудников, занимающих её.`)) {
                                          handleDeletePos(pos.code);
                                        }
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: ROLES */}
            {structureSubTab === 'roles' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Create Role Form Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Добавить роль</h3>
                  </div>
                  <form onSubmit={handleCreateRole} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Код роли * (строковый ID)</label>
                      <input
                        type="text"
                        value={newRoleCode}
                        onChange={(e) => setNewRoleCode(e.target.value)}
                        placeholder="e.g. support-specialist"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название роли *</label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="e.g. Специалист поддержки"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Системные права доступа *</label>
                      <select
                        value={newRoleSys}
                        onChange={(e) => setNewRoleSys(e.target.value as UserRole)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800 font-medium"
                        required
                      >
                        <option value="employee">Сотрудник (Личный кабинет)</option>
                        <option value="manager">Менеджер (Управление структурой и командой)</option>
                        <option value="admin">Администратор (Полный доступ к платформе)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isRoleSubmitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isRoleSubmitting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Создать роль</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Roles List Table */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Список зарегистрированных ролей</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-3">Код</th>
                          <th className="px-6 py-3">Название</th>
                          <th className="px-6 py-3">Системная роль</th>
                          <th className="px-6 py-3 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {dbRoles.map((role) => (
                          <tr key={role.code} className="hover:bg-slate-50/30 transition-all">
                            <td className="px-6 py-3.5 font-mono text-xs text-slate-500 font-bold">{role.code}</td>
                            <td className="px-6 py-3.5 font-medium">
                              {editingRoleCodeState === role.code ? (
                                <input
                                  type="text"
                                  value={editingRoleName}
                                  onChange={(e) => setEditingRoleName(e.target.value)}
                                  className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500/30"
                                />
                              ) : (
                                <span>{role.name}</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-xs">
                              {editingRoleCodeState === role.code ? (
                                <select
                                  value={editingRoleSys}
                                  onChange={(e) => setEditingRoleSys(e.target.value as UserRole)}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium cursor-pointer"
                                >
                                  <option value="employee">Сотрудник</option>
                                  <option value="manager">Менеджер</option>
                                  <option value="admin">Администратор</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                                  role.systemRole === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                                  role.systemRole === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                  'bg-slate-100 text-slate-600 border-slate-200/50'
                                }`}>
                                  {role.systemRole === 'admin' ? 'Администратор' : role.systemRole === 'manager' ? 'Менеджер' : 'Сотрудник'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {editingRoleCodeState === role.code ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRole(role.code)}
                                    className="p-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 cursor-pointer"
                                    title="Сохранить"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRoleCodeState(null)}
                                    className="p-1 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 cursor-pointer"
                                    title="Отмена"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRoleCodeState(role.code);
                                      setEditingRoleName(role.name);
                                      setEditingRoleSys(role.systemRole);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                    title="Редактировать"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Вы уверены, что хотите удалить роль "${role.name}"? Это сбросит роль на "Сотрудник" для должностей, привязанных к ней.`)) {
                                        handleDeleteRole(role.code);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="Удалить"
                                    disabled={role.code === 'admin' || role.code === 'employee'}
                                  >
                                    <Trash2 className={`w-3.5 h-3.5 ${(role.code === 'admin' || role.code === 'employee') ? 'opacity-30' : ''}`} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 4: RANKS */}
            {structureSubTab === 'ranks' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Position Selection and Add Rank Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 font-sans">Выбор должности</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Должность *</label>
                      <select
                        value={selectedRankPosCode}
                        onChange={(e) => {
                          setSelectedRankPosCode(e.target.value);
                          setEditingRankIndex(null);
                          setNewRankName('');
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800 font-medium"
                      >
                        <option value="">Выберите должность</option>
                        {dbPositions.map(pos => (
                          <option key={pos.code} value={pos.code}>
                            {pos.name} ({dbDepartments.find(d => d.id === pos.departmentId)?.name || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedRankPosCode && (
                      <form onSubmit={handleAddRankToPosition} className="space-y-3.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 pb-1">
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                          <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Добавить новый ранг</h4>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={newRankName}
                            onChange={(e) => setNewRankName(e.target.value)}
                            placeholder="e.g. Specialist L4 (Principal)"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isRankSubmitting}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isRankSubmitting ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Добавить ранг</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Ranks List Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[250px] flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Список рангов должности</h3>
                    {selectedRankPosCode && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                        Код: {selectedRankPosCode}
                      </span>
                    )}
                  </div>

                  {!selectedRankPosCode ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <Tag className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-sm">Выберите должность в левой панели для управления рангами</p>
                    </div>
                  ) : (
                    (() => {
                      const pos = dbPositions.find(p => p.code === selectedRankPosCode);
                      const posRanks = pos?.ranks || [];

                      if (posRanks.length === 0) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                            <AlertTriangle className="w-7 h-7 text-amber-400/80 mb-2 stroke-[1.5]" />
                            <p className="text-sm">У этой должности пока нет настроенных рангов</p>
                            <p className="text-xs text-slate-400 mt-1">Используйте форму слева, чтобы создать первый ранг</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-3 w-16">#</th>
                                <th className="px-6 py-3">Название ранга</th>
                                <th className="px-6 py-3 text-right">Действия</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {posRanks.map((rank, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/30 transition-all">
                                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400">{rIdx + 1}</td>
                                  <td className="px-6 py-3.5 font-medium text-slate-800">
                                    {editingRankIndex === rIdx ? (
                                      <div className="flex items-center gap-2 max-w-md">
                                        <input
                                          type="text"
                                          value={editingRankNameValue}
                                          onChange={(e) => setEditingRankNameValue(e.target.value)}
                                          className="px-3 py-1 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500/30"
                                          required
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateRankOfPosition(rIdx)}
                                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
                                          title="Сохранить"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingRankIndex(null)}
                                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer shrink-0"
                                          title="Отмена"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-700">{rank}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-3.5 text-right w-32">
                                    {editingRankIndex !== rIdx && (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingRankIndex(rIdx);
                                            setEditingRankNameValue(rank);
                                          }}
                                          className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                                          title="Редактировать"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRankFromPosition(rIdx)}
                                          className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                          title="Удалить"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Top Actions Bar */}
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Управление курсами обучения</h2>
              {!showCourseForm && (
                <button
                  onClick={() => {
                    resetCourseForm();
                    setShowCourseForm(true);
                  }}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать учебный курс</span>
                </button>
              )}
            </div>

            {/* Course Edit/Create Form */}
            {showCourseForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {editingCourseId ? 'Редактирование курса' : 'Создание нового курса'}
                  </h3>
                  <button
                    onClick={() => setShowCourseForm(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdateCourse} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Course Header Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название курса *</label>
                        <input
                          type="text"
                          value={courseTitle}
                          onChange={(e) => setCourseTitle(e.target.value)}
                          placeholder="e.g. Вводный курс по биллингу"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Описание курса</label>
                        <textarea
                          value={courseDescription}
                          onChange={(e) => setCourseDescription(e.target.value)}
                          placeholder="Краткое описание целей курса и целевой аудитории..."
                          rows={4}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Срок обучения (дней) *</label>
                          <input
                            type="number"
                            min={1}
                            value={courseStudyDuration}
                            onChange={(e) => setCourseStudyDuration(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Срок аттестации (дней) *</label>
                          <input
                            type="number"
                            min={1}
                            value={courseExamDuration}
                            onChange={(e) => setCourseExamDuration(Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target positions and ranks multiple bindings */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                          Связанные должности и ранги * ({courseBindings.length})
                        </label>
                        
                        {/* Selected bindings list */}
                        {courseBindings.length === 0 ? (
                          <div className="bg-amber-50/50 border border-amber-200/60 text-amber-850 text-xs p-4 rounded-2xl mb-4 leading-relaxed">
                            Курс еще не привязан ни к одной должности. Пожалуйста, добавьте хотя бы одну привязку ниже.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 mb-4 max-h-[180px] overflow-y-auto pr-1">
                            {courseBindings.map((binding, bIdx) => (
                              <div 
                                key={bIdx}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800">
                                    {binding.positionName || dbPositions.find(p => p.code === binding.positionCode)?.name || binding.positionCode}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                                    {binding.rank ? `Ограничение по рангу: ${binding.rank}` : 'Доступно всем рангам этой должности'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCourseBinding(bIdx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Удалить привязку"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Form controls to add new binding */}
                        <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Добавить привязку к должности и рангу
                          </p>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Должность *
                              </label>
                              <select
                                value={tempBindingPosCode}
                                onChange={(e) => {
                                  setTempBindingPosCode(e.target.value);
                                  setTempBindingRank('');
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800"
                              >
                                <option value="">-- Выберите должность --</option>
                                {dbPositions.map((pos) => (
                                  <option key={pos.code} value={pos.code}>
                                    [{pos.code}] {pos.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {tempBindingPosCode && (() => {
                              const selectedPos = dbPositions.find(p => p.code === tempBindingPosCode);
                              const posRanks = selectedPos?.ranks || [];
                              return (
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Привязка к рангу
                                  </label>
                                  <select
                                    value={tempBindingRank}
                                    onChange={(e) => setTempBindingRank(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-slate-800"
                                  >
                                    <option value="">Все ранги (доступно всем рангам этой должности)</option>
                                    {posRanks.map((rank) => (
                                      <option key={rank} value={rank}>
                                        Конкретный ранг: {rank}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })()}

                            <button
                              type="button"
                              onClick={handleAddCourseBinding}
                              disabled={!tempBindingPosCode}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Добавить в список привязок
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lessons section */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        Уроки курса ({courseLessons.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddLessonField}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить урок</span>
                      </button>
                    </div>

                    {courseLessons.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        Нет добавленных уроков. Создайте хотя бы один урок для наполнения курса.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {courseLessons.map((lesson, idx) => (
                          <div
                            key={lesson.id}
                            className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 space-y-4 relative"
                          >
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Урок #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveLessonField(idx)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Удалить этот урок"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Тема урока *</label>
                                  <input
                                    type="text"
                                    value={lesson.topic}
                                    onChange={(e) => handleLessonFieldChange(idx, 'topic', e.target.value)}
                                    placeholder="Тема урока..."
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Краткое описание урока</label>
                                  <input
                                    type="text"
                                    value={lesson.description}
                                    onChange={(e) => handleLessonFieldChange(idx, 'description', e.target.value)}
                                    placeholder="О чем этот урок..."
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ссылка на PDF материал</label>
                                    <input
                                      type="text"
                                      value={lesson.pdfUrl || ''}
                                      onChange={(e) => handleLessonFieldChange(idx, 'pdfUrl', e.target.value)}
                                      placeholder="https://example.com/file.pdf"
                                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ссылка на видео урок (YouTube/etc)</label>
                                    <input
                                      type="text"
                                      value={lesson.videoUrl || ''}
                                      onChange={(e) => handleLessonFieldChange(idx, 'videoUrl', e.target.value)}
                                      placeholder="https://youtube.com/embed/..."
                                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Содержание урока *</label>
                                <textarea
                                  value={lesson.content}
                                  onChange={(e) => handleLessonFieldChange(idx, 'content', e.target.value)}
                                  placeholder="Основной текстовый или обучающий материал урока..."
                                  rows={7}
                                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCourseForm(false);
                        resetCourseForm();
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isCourseSubmitting || courseLessons.length === 0}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    >
                      {isCourseSubmitting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Сохранить курс</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Courses List - Master-Detail layout */}
            {isCoursesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-xs">
                <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-slate-400">Загрузка курсов обучения...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest text-[11px]">Курсы еще не созданы</p>
                <p className="text-xs text-slate-400 mt-2">Добавьте ваш первый учебный курс для специалистов поддержки!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Courses List with Search & Filtering */}
                <div className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${mobileViewingCourseDetails ? 'hidden lg:flex' : 'flex'}`}>
                  
                  {/* Header and Filters Area */}
                  <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Фильтры и Поиск</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Найдено: {filteredCourses.length}
                      </span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Поиск по названию, уроку..."
                        value={courseSearchQuery}
                        onChange={(e) => setCourseSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      {courseSearchQuery && (
                        <button 
                          onClick={() => setCourseSearchQuery('')} 
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Dropdowns Filters */}
                    <div>
                      <select
                        value={courseFilterPosition}
                        onChange={(e) => setCourseFilterPosition(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                      >
                        <option value="all">Все должности</option>
                        {dbPositions.map(pos => (
                          <option key={pos.code} value={pos.code}>
                            [{pos.code}] {pos.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Courses Scrollable List */}
                  <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-100">
                    {filteredCourses.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-[10px]">Курсы не найдены</p>
                        <p className="text-[11px] text-slate-450 mt-1">Попробуйте изменить параметры фильтрации</p>
                      </div>
                    ) : (
                      filteredCourses.map((course) => {
                        const isSelected = course.id === selectedCourseId;
                        const lessonsCount = course.lessons ? course.lessons.length : 0;
                        
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setMobileViewingCourseDetails(true);
                            }}
                            className={`w-full text-left p-4 transition-all flex items-start gap-3 border-l-4 cursor-pointer hover:bg-slate-50/50 ${
                              isSelected 
                                ? 'bg-indigo-50/40 border-indigo-600' 
                                : 'border-transparent'
                            }`}
                          >
                            {/* Course Icon Container */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                              isSelected 
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              <BookOpen className="w-4 h-4" />
                            </div>

                            {/* Basic Info */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">
                                {course.title}
                              </h4>
                              <p className="text-[10px] text-indigo-600 font-semibold truncate leading-tight">
                                {lessonsCount} {lessonsCount === 1 ? 'урок' : lessonsCount >= 2 && lessonsCount <= 4 ? 'урока' : 'уроков'}
                              </p>
                              
                              <div className="flex flex-wrap gap-1 mt-1">
                                {course.bindings && course.bindings.length > 0 ? (
                                  course.bindings.slice(0, 1).map((b, idx) => (
                                    <span key={idx} className="inline-block px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-bold uppercase rounded-md tracking-wider">
                                      {dbPositions.find(p => p.code === b.positionCode)?.name || b.positionCode}
                                    </span>
                                  ))
                                ) : (
                                  course.positionCode && (
                                    <span className="inline-block px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-bold uppercase rounded-md tracking-wider">
                                      {dbPositions.find(p => p.code === course.positionCode)?.name || course.positionCode}
                                    </span>
                                  )
                                )}
                                {course.bindings && course.bindings.length > 1 && (
                                  <span className="inline-block px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[8px] font-bold uppercase rounded-md tracking-wider">
                                    +{course.bindings.length - 1}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Detailed View */}
                <div className={`lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6 overflow-hidden ${!mobileViewingCourseDetails ? 'hidden lg:flex' : 'flex'}`}>
                  
                  {/* Mobile Back Button */}
                  <div className="lg:hidden flex items-center mb-2">
                    <button
                      type="button"
                      onClick={() => setMobileViewingCourseDetails(false)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all"
                    >
                      ← К списку курсов
                    </button>
                  </div>

                  {(() => {
                    const selectedCourse = courses.find(c => c.id === selectedCourseId);
                    if (!selectedCourse) {
                      return (
                        <div className="text-center py-20">
                          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Курс не выбран</h3>
                          <p className="text-xs text-slate-400 mt-2">Выберите курс из списка слева для просмотра подробного плана и уроков.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Top Header Card of Course Detail Panel */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                          
                          {/* Course Icon & General Title */}
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                              <BookOpen className="w-7 h-7" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                                  {selectedCourse.title}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border border-indigo-200/45 bg-indigo-50 text-indigo-700 shrink-0">
                                  {selectedCourse.lessons.length} уроков
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-500 leading-none pt-0.5">
                                Создан: {new Date(selectedCourse.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
                            <button
                              type="button"
                              onClick={() => handleEditCourseClick(selectedCourse)}
                              className="px-3.5 py-1.5 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all cursor-pointer text-xs font-bold text-slate-650 flex items-center gap-1.5"
                              title="Редактировать курс"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Редактировать</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCourse(selectedCourse.id)}
                              className="p-2 border border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer text-slate-450 hover:text-rose-600"
                              title="Удалить курс"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description & Bindings Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          
                          {/* Description info */}
                          <div className="space-y-4 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">Описание & Цели курса</h4>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              {selectedCourse.description || 'У этого курса пока нет развернутого описания.'}
                            </p>
                          </div>

                          {/* Bindings & targets list */}
                          <div className="space-y-4 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">Назначенные должности & Ранги</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedCourse.bindings && selectedCourse.bindings.length > 0 ? (
                                selectedCourse.bindings.map((b, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-650 rounded-lg text-[9px] font-bold font-mono uppercase tracking-tight shadow-2xs">
                                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                                    {b.positionName || dbPositions.find(p => p.code === b.positionCode)?.name || b.positionCode} {b.rank ? `(${b.rank})` : '• Все ранги'}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-650 rounded-lg text-[9px] font-bold font-mono uppercase tracking-tight shadow-2xs">
                                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                                  {selectedCourse.positionName} {selectedCourse.rank ? `(${selectedCourse.rank})` : '• Все ранги'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* List of Lessons (Full syllabus) */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">План и Содержание занятий</h4>
                          
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {selectedCourse.lessons.map((lesson, idx) => (
                              <div key={lesson.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3.5 hover:border-slate-350 transition-all">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1 flex-1">
                                    <h5 className="font-extrabold text-slate-800 text-xs leading-snug">
                                      {idx + 1}. {lesson.topic}
                                    </h5>
                                    {lesson.description && (
                                      <p className="text-[10px] text-slate-500 italic leading-snug">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Media Badges */}
                                  <div className="flex gap-1 shrink-0">
                                    {lesson.pdfUrl && (
                                      <span className="text-[8px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">PDF</span>
                                    )}
                                    {lesson.videoUrl && (
                                      <span className="text-[8px] bg-indigo-50 text-indigo-750 border border-indigo-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Video</span>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-slate-50/55 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-650 leading-relaxed font-sans max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                                  {lesson.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attestation' && (
          <div className="space-y-6">
            {/* Attestation Header / Subtabs */}
            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex-wrap gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Аттестация сотрудников поддержки</h2>
                <p className="text-xs text-slate-500">Система оценки знаний по 10-балльной шкале по темам обучения</p>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setAttestationSubTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    attestationSubTab === 'analytics'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Аналитика успеваемости</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAttestationSubTab('evaluate');
                    if (!attestationEmployeeId && employees.length > 0) {
                      const firstEmp = employees.filter(e => e.status !== 'pending')[0];
                      if (firstEmp) {
                        setAttestationEmployeeId(firstEmp.id);
                        const assigned = courses.filter(c => 
                          c.positionCode === firstEmp.profile.positionCode && 
                          (!c.rank || c.rank === firstEmp.profile.rank)
                        );
                        if (assigned.length > 0) {
                          setAttestationCourseId(assigned[0].id);
                        }
                      }
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    attestationSubTab === 'evaluate'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Проведение оценки</span>
                </button>
              </div>
            </div>

            {/* Subtab 1: ANALYTICS */}
            {attestationSubTab === 'analytics' && (
              <div className="space-y-6">
                {/* Meta stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Средний балл команды</span>
                      <span className="block text-3xl font-light text-indigo-600 mt-2 font-mono">
                        {(() => {
                          const validGrades = grades.filter(g => g.score > 0);
                          if (validGrades.length === 0) return '—';
                          return (validGrades.reduce((sum, g) => sum + g.score, 0) / validGrades.length).toFixed(1);
                        })()}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-50 border border-indigo-100/30 rounded-xl text-indigo-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Аттестовано тем</span>
                      <span className="block text-3xl font-light text-emerald-600 mt-2 font-mono">{grades.length}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-100/30 rounded-xl text-emerald-500">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Активных курсов</span>
                      <span className="block text-3xl font-light text-slate-900 mt-2 font-mono">{courses.length}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Left Column: Course & Topic Averages */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Успеваемость по курсам и темам</h3>
                        </div>
                        {courses.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newMap: Record<string, boolean> = {};
                                courses.forEach(c => {
                                  newMap[c.id] = true;
                                });
                                setExpandedAttestationCourses(newMap);
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              Развернуть все
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newMap: Record<string, boolean> = {};
                                courses.forEach(c => {
                                  newMap[c.id] = false;
                                });
                                setExpandedAttestationCourses(newMap);
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              Свернуть все
                            </button>
                          </div>
                        )}
                      </div>

                      {courses.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          Курсы обучения не найдены. Создайте курсы во вкладке "Курсы обучения".
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {courses.map((course) => {
                            const courseGrades = grades.filter(g => g.courseId === course.id);
                            const courseAvg = courseGrades.length > 0 
                              ? (courseGrades.reduce((sum, g) => sum + g.score, 0) / courseGrades.length).toFixed(1) 
                              : null;
                            const isExpanded = !!expandedAttestationCourses[course.id];

                            return (
                              <div key={course.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/20 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
                                      {course.positionName} {course.rank ? `(${course.rank})` : '• Все ранги'}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900">{course.title}</h4>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ср. балл курса</span>
                                    <span className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-lg mt-1 ${
                                      courseAvg === null ? 'bg-slate-100 text-slate-400' :
                                      Number(courseAvg) >= 8.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                      Number(courseAvg) >= 5.0 ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                      'bg-rose-50 text-rose-700 border border-rose-150'
                                    }`}>
                                      {courseAvg !== null ? `${courseAvg} / 10` : 'нет оценок'}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedAttestationCourses(prev => ({
                                      ...prev,
                                      [course.id]: !isExpanded
                                    }))}
                                    className="flex items-center justify-between w-full text-left py-1 text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                                  >
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      Детализация по темам уроков ({course.lessons.length})
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50/60 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                                      <span>{isExpanded ? 'Скрыть' : 'Показать'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-indigo-600" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-indigo-600" />
                                      )}
                                    </div>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="space-y-2 mt-3 pt-1">
                                          {course.lessons.map((lesson, idx) => {
                                            const lessonGrades = grades.filter(g => g.courseId === course.id && g.lessonId === lesson.id);
                                            const lessonAvg = lessonGrades.length > 0
                                              ? (lessonGrades.reduce((sum, g) => sum + g.score, 0) / lessonGrades.length).toFixed(1)
                                              : null;

                                            return (
                                              <div key={lesson.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl text-xs hover:border-indigo-100 transition-all">
                                                <div className="min-w-0 pr-4">
                                                  <p className="font-semibold text-slate-800 truncate">
                                                    <span className="text-slate-400 font-mono mr-1">{idx + 1}.</span> {lesson.topic}
                                                  </p>
                                                  <p className="text-[10px] text-slate-400 truncate">{lesson.description}</p>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                  <span className="text-[10px] text-slate-400">{lessonGrades.length} оценок</span>
                                                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                                    lessonAvg === null ? 'bg-slate-50 text-slate-400' :
                                                    Number(lessonAvg) >= 8.0 ? 'bg-emerald-50 text-emerald-600' :
                                                    Number(lessonAvg) >= 5.0 ? 'bg-amber-50 text-amber-600' :
                                                    'bg-rose-50 text-rose-600'
                                                  }`}>
                                                    {lessonAvg !== null ? `${lessonAvg} / 10` : '—'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Employees Averages */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 font-sans">Успеваемость сотрудников</h3>
                    </div>

                    <div className="space-y-3">
                      {employees.filter(emp => emp.status !== 'pending').map((emp) => {
                        const assignedCourses = courses.filter(c => 
                          c.positionCode === emp.profile.positionCode && 
                          (!c.rank || c.rank === emp.profile.rank)
                        );
                        const totalLessons = assignedCourses.reduce((sum, c) => sum + c.lessons.length, 0);
                        const empGrades = grades.filter(g => g.employeeId === emp.id);
                        const empAvg = empGrades.length > 0
                          ? (empGrades.reduce((sum, g) => sum + g.score, 0) / empGrades.length).toFixed(1)
                          : null;

                        return (
                          <div key={emp.id} className="p-3 border border-slate-150 rounded-2xl hover:border-indigo-150 transition-all space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 leading-tight">{emp.name}</h4>
                                <span className="text-[9px] text-slate-400 block font-semibold">
                                  {emp.profile.positionName} {emp.profile.rank ? `• ${emp.profile.rank}` : ''}
                                </span>
                              </div>
                              <span className={`text-xs font-mono font-bold shrink-0 px-2 py-0.5 rounded-lg ${
                                empAvg === null ? 'bg-slate-150 text-slate-400' :
                                Number(empAvg) >= 8.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                Number(empAvg) >= 5.0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {empAvg !== null ? `${empAvg}` : '—'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-450 pt-1 border-t border-slate-50">
                              <span>Аттестовано: {empGrades.length} из {totalLessons}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttestationEmployeeId(emp.id);
                                  if (assignedCourses.length > 0) {
                                    setAttestationCourseId(assignedCourses[0].id);
                                  } else if (courses.length > 0) {
                                    setAttestationCourseId(courses[0].id);
                                  }
                                  setAttestationSubTab('evaluate');
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider text-[9px] cursor-pointer"
                              >
                                Оценить →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 2: EVALUATE - Master-Detail layout */}
            {attestationSubTab === 'evaluate' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Employees List with Search & Filtering */}
                <div className={`lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${mobileViewingAttestationDetails ? 'hidden lg:flex' : 'flex'}`}>
                  
                  {/* Header and Filters Area */}
                  <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Сотрудники для оценки</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        Найдено: {filteredAttestationEmployees.length}
                      </span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Поиск по имени, почте, отделу..."
                        value={attestationSearchQuery}
                        onChange={(e) => setAttestationSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      {attestationSearchQuery && (
                        <button 
                          onClick={() => setAttestationSearchQuery('')} 
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter by Position dropdown */}
                    <div>
                      <select
                        value={attestationFilterPosition}
                        onChange={(e) => setAttestationFilterPosition(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                      >
                        <option value="all">Все должности</option>
                        {dbPositions.map(pos => (
                          <option key={pos.code} value={pos.code}>
                            [{pos.code}] {pos.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scrollable list of Employees */}
                  <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-100">
                    {filteredAttestationEmployees.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-[10px]">Сотрудники не найдены</p>
                        <p className="text-[11px] text-slate-450 mt-1">Измените параметры поиска или фильтрации</p>
                      </div>
                    ) : (
                      filteredAttestationEmployees.map((emp) => {
                        const isSelected = emp.id === attestationEmployeeId;
                        
                        // Calculate metrics
                        const assignedCourses = courses.filter(c => {
                          if (c.bindings && c.bindings.length > 0) {
                            return c.bindings.some(b => b.positionCode === emp.profile.positionCode && (!b.rank || b.rank === emp.profile.rank));
                          }
                          return c.positionCode === emp.profile.positionCode && (!c.rank || c.rank === emp.profile.rank);
                        });
                        const totalLessons = assignedCourses.reduce((sum, c) => sum + c.lessons.length, 0);
                        const empGrades = grades.filter(g => g.employeeId === emp.id);
                        
                        const empAvg = empGrades.length > 0
                          ? (empGrades.reduce((sum, g) => sum + g.score, 0) / empGrades.length).toFixed(1)
                          : null;

                        return (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setAttestationEmployeeId(emp.id);
                              setActiveLessonToGrade(null);
                              setMobileViewingAttestationDetails(true);
                              
                              // Select the recommended course if none selected or not assigned to the new employee
                              const assigned = courses.filter(c => {
                                if (c.bindings && c.bindings.length > 0) {
                                  return c.bindings.some(b => b.positionCode === emp.profile.positionCode && (!b.rank || b.rank === emp.profile.rank));
                                }
                                return c.positionCode === emp.profile.positionCode && (!c.rank || c.rank === emp.profile.rank);
                              });
                              if (assigned.length > 0) {
                                setAttestationCourseId(assigned[0].id);
                              } else if (courses.length > 0) {
                                setAttestationCourseId(courses[0].id);
                              }
                            }}
                            className={`w-full text-left p-4 transition-all flex items-start gap-3 border-l-4 cursor-pointer hover:bg-slate-50/50 ${
                              isSelected 
                                ? 'bg-indigo-50/40 border-indigo-600' 
                                : 'border-transparent'
                            }`}
                          >
                            {/* Avatar or Icon container */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-extrabold shrink-0 uppercase ${
                              isSelected 
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {emp.name.slice(0, 2)}
                            </div>

                            {/* Basic Info */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-slate-800 text-xs truncate leading-snug">
                                  {emp.name}
                                </h4>
                                {empAvg !== null && (
                                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                    Number(empAvg) >= 8.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    Number(empAvg) >= 5.0 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {empAvg}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-[10px] text-slate-500 font-semibold truncate leading-none">
                                {emp.profile.positionName} {emp.profile.rank ? `(${emp.profile.rank})` : ''}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate leading-tight pt-0.5">
                                Аттестовано уроков: <span className="font-semibold text-slate-600">{empGrades.length}</span> из {totalLessons}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Detailed Grade Sheet for Employee */}
                <div className={`lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col space-y-6 overflow-hidden ${!mobileViewingAttestationDetails ? 'hidden lg:flex' : 'flex'}`}>
                  
                  {/* Mobile Back Button */}
                  <div className="lg:hidden flex items-center mb-2">
                    <button
                      type="button"
                      onClick={() => setMobileViewingAttestationDetails(false)}
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all"
                    >
                      ← К списку сотрудников
                    </button>
                  </div>

                  {(() => {
                    const selectedEmpObj = employees.find(e => e.id === attestationEmployeeId);
                    const selectedCourseObj = courses.find(c => c.id === attestationCourseId);

                    if (!selectedEmpObj) {
                      return (
                        <div className="text-center py-20">
                          <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Сотрудник не выбран</h3>
                          <p className="text-xs text-slate-400 mt-2">Выберите сотрудника из списка слева, чтобы открыть ведомость его аттестации и выставить оценки.</p>
                        </div>
                      );
                    }

                    const assignedCourses = courses.filter(c => {
                      if (c.bindings && c.bindings.length > 0) {
                        return c.bindings.some(b => b.positionCode === selectedEmpObj.profile.positionCode && (!b.rank || b.rank === selectedEmpObj.profile.rank));
                      }
                      return c.positionCode === selectedEmpObj.profile.positionCode && (!c.rank || c.rank === selectedEmpObj.profile.rank);
                    });
                    
                    const isAssigned = selectedCourseObj && assignedCourses.some(c => c.id === selectedCourseObj.id);

                    return (
                      <div className="space-y-6">
                        
                        {/* Employee Detailed Profile Header Card */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-200 text-lg font-black shrink-0">
                              {selectedEmpObj.name.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                                {selectedEmpObj.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                {selectedEmpObj.profile.positionName} {selectedEmpObj.profile.rank ? `• ${selectedEmpObj.profile.rank}` : ''} • {selectedEmpObj.profile.department}
                              </p>
                            </div>
                          </div>

                          {/* Quick Stats Block */}
                          <div className="flex gap-3 shrink-0">
                            {(() => {
                              const empGrades = grades.filter(g => g.employeeId === selectedEmpObj.id);
                              const empAvg = empGrades.length > 0
                                ? (empGrades.reduce((sum, g) => sum + g.score, 0) / empGrades.length).toFixed(1)
                                : null;
                              return (
                                <>
                                  <div className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Ср. БАЛЛ</span>
                                    <span className={`text-sm font-bold font-mono block mt-1 ${
                                      empAvg === null ? 'text-slate-400' :
                                      Number(empAvg) >= 8.0 ? 'text-emerald-600' :
                                      Number(empAvg) >= 5.0 ? 'text-amber-600' :
                                      'text-rose-600'
                                    }`}>
                                      {empAvg || '—'}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">ОЦЕНЕНО</span>
                                    <span className="text-sm font-bold font-mono text-indigo-600 block mt-1">
                                      {empGrades.length}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Course Selector and Assignment info */}
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Выбрать учебную программу</label>
                            <select
                              value={attestationCourseId}
                              onChange={(e) => {
                                setAttestationCourseId(e.target.value);
                                setActiveLessonToGrade(null);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                            >
                              <option value="">-- Выберите учебный курс --</option>
                              {courses.map(course => {
                                const recommended = course.bindings && course.bindings.length > 0 
                                  ? course.bindings.some(b => b.positionCode === selectedEmpObj.profile.positionCode && (!b.rank || b.rank === selectedEmpObj.profile.rank))
                                  : course.positionCode === selectedEmpObj.profile.positionCode && (!course.rank || course.rank === selectedEmpObj.profile.rank);
                                return (
                                  <option key={course.id} value={course.id}>
                                    {course.title} {recommended ? ' (Рекомендован)' : ' (Вне программы)'}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {selectedCourseObj && (
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border self-start ${
                                  isAssigned 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  <Tag className="w-2.5 h-2.5" />
                                  {isAssigned ? 'Рекомендованный' : 'Дополнительный'}
                                </span>
                                {(() => {
                                  const startedDates = selectedEmpObj.profile.courseStartedDates || {};
                                  const startedAtStr = startedDates[selectedCourseObj.id];
                                  const studyDays = selectedCourseObj.studyDurationDays || 7;
                                  const examDays = selectedCourseObj.examDurationDays || 3;

                                  return (
                                    <div className="text-[11px] text-slate-550 space-y-0.5 mt-1">
                                      {startedAtStr ? (
                                        <>
                                          <div className="text-emerald-700 font-bold">Начало: {new Date(startedAtStr).toLocaleDateString('ru-RU')}</div>
                                          <div>Срок обучения: {studyDays} дн. (до {new Date(new Date(startedAtStr).getTime() + studyDays * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')})</div>
                                          <div className="font-semibold text-indigo-700">Аттестация: до {new Date(new Date(startedAtStr).getTime() + (studyDays + examDays) * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}</div>
                                        </>
                                      ) : (
                                        <div className="text-rose-600 italic font-semibold">Обучение не начато</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              <div className="border-t md:border-t-0 md:border-l border-slate-150 pt-2 md:pt-0 md:pl-3 flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Изменить дату начала</span>
                                <input
                                  type="date"
                                  value={(() => {
                                    const startedDates = selectedEmpObj.profile.courseStartedDates || {};
                                    const startedAtStr = startedDates[selectedCourseObj.id];
                                    return startedAtStr ? startedAtStr.split('T')[0] : '';
                                  })()}
                                  onChange={async (e) => {
                                    const val = e.target.value;
                                    const updatedStarts = {
                                      ...(selectedEmpObj.profile.courseStartedDates || {}),
                                    };
                                    if (val) {
                                      updatedStarts[selectedCourseObj.id] = new Date(val).toISOString();
                                    } else {
                                      delete updatedStarts[selectedCourseObj.id];
                                    }

                                    try {
                                      const token = localStorage.getItem('support_learning_token');
                                      const response = await fetch(`/api/employees/${selectedEmpObj.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                          courseStartedDates: updatedStarts
                                        })
                                      });
                                      if (response.ok) {
                                        const updatedEmp = await response.json();
                                        setEmployees(prev => prev.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
                                      }
                                    } catch (err) {
                                      console.error('Failed to set started date', err);
                                    }
                                  }}
                                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Lessons List in Detail view */}
                        {!selectedCourseObj ? (
                          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-semibold">Выберите учебный курс в выпадающем списке выше</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150 pb-2">Уроки и ведомость оценок</h4>
                            
                            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                              {selectedCourseObj.lessons.map((lesson, idx) => {
                                const currentGrade = grades.find(g => g.employeeId === selectedEmpObj.id && g.courseId === selectedCourseObj.id && g.lessonId === lesson.id);
                                const isEditingThis = activeLessonToGrade?.id === lesson.id;

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`border rounded-2xl p-4 transition-all ${
                                      isEditingThis 
                                        ? 'border-indigo-500 bg-indigo-50/5 ring-1 ring-indigo-500' 
                                        : currentGrade 
                                        ? 'border-slate-200 bg-white shadow-2xs' 
                                        : 'border-slate-200 bg-slate-50/10'
                                    }`}
                                  >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                      <div className="min-w-0 flex-1">
                                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">Тема {idx + 1}</span>
                                        <h5 className="font-extrabold text-slate-800 text-xs leading-snug">{lesson.topic}</h5>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{lesson.description}</p>
                                      </div>

                                      <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                                        {currentGrade ? (
                                          <div className="text-right">
                                            <div className="flex items-center gap-1.5 justify-end">
                                              <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg border ${
                                                currentGrade.score >= 8 ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                                                currentGrade.score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-150' :
                                                'bg-rose-50 text-rose-700 border-rose-150'
                                              }`}>
                                                {currentGrade.score} / 10
                                              </span>
                                            </div>
                                            <span className="text-[8px] text-slate-400 block mt-0.5">
                                              {currentGrade.gradedByName || 'Менеджер'} • {new Date(currentGrade.gradedAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg">
                                            Не оценен
                                          </span>
                                        )}

                                        {!isEditingThis && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveLessonToGrade(lesson);
                                              setAttestationScore(currentGrade ? currentGrade.score : 10);
                                              setAttestationComment(currentGrade ? currentGrade.comment : '');
                                            }}
                                            className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-2xs cursor-pointer"
                                          >
                                            Оценить
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {currentGrade?.comment && !isEditingThis && (
                                      <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 italic">
                                        <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-widest block mb-1 not-italic">Отзыв менеджера:</span>
                                        «{currentGrade.comment}»
                                      </div>
                                    )}

                                    {isEditingThis && (
                                      <div className="mt-5 pt-4 border-t border-indigo-100 space-y-4">
                                        <div className="space-y-2">
                                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Выберите оценку (от 1 до 10) *</label>
                                          <div className="flex flex-wrap gap-1.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                                              const isSelected = attestationScore === num;
                                              return (
                                                <button
                                                  key={num}
                                                  type="button"
                                                  onClick={() => setAttestationScore(num)}
                                                  className={`w-9 h-9 rounded-full font-mono font-bold text-sm transition-all flex items-center justify-center border cursor-pointer ${
                                                    isSelected 
                                                      ? num >= 8 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100 scale-105 font-bold'
                                                        : num >= 5 
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-100 scale-105 font-bold'
                                                        : 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-100 scale-105 font-bold'
                                                      : num >= 8 
                                                      ? 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-100'
                                                      : num >= 5 
                                                      ? 'bg-white hover:bg-amber-50 text-amber-600 border-amber-100'
                                                      : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-100'
                                                  }`}
                                                >
                                                  {num}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1 pt-1">
                                            <span className="text-rose-500">1-4: Слабо</span>
                                            <span className="text-amber-500">5-7: Хорошо</span>
                                            <span className="text-emerald-500">8-10: Отлично</span>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Отзыв, рекомендации и обратная связь (необязательно)</label>
                                          <textarea
                                            value={attestationComment}
                                            onChange={(e) => setAttestationComment(e.target.value)}
                                            placeholder="Например, «Продемонстрировал отличные практические навыки, однако требуется глубже изучить регламент SLA...»"
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                                          />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2">
                                          <button
                                            type="button"
                                            onClick={() => setActiveLessonToGrade(null)}
                                            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                                          >
                                            Отмена
                                          </button>
                                          <button
                                            type="button"
                                            disabled={isSubmittingGrade}
                                            onClick={() => handleSubmitGrade(lesson.id, attestationScore, attestationComment)}
                                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
                                          >
                                            {isSubmittingGrade ? (
                                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Сохранить оценку</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ticket Academy Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fade-in p-6">
            {/* Header section with Stats Cards */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-950">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400">Модуль поддержки</span>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <TicketIcon className="w-6 h-6 text-indigo-400" />
                  Ticket Academy
                </h2>
                <p className="text-xs text-slate-400 max-w-xl">
                  Администрирование каналов связи, клиентов, стран присутствия, магазинов и контроль выполнения заявок.
                </p>
              </div>

              {/* Sub-navigation Tabs in Header */}
              <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('tickets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'tickets'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Заявки
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('channels')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'channels'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Каналы
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('clients')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'clients'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Клиенты
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('stores')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'stores'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Магазины
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('kinds')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'kinds'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Виды тикетов
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('countries')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'countries'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Страны
                </button>
                <button
                  type="button"
                  onClick={() => setTicketAcademySubTab('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketAcademySubTab === 'categories'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Матрица категорий
                </button>
              </div>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2">
                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Subtab Contents */}
            {ticketAcademySubTab === 'tickets' && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Всего тикетов</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block font-mono">{tickets.length}</span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Открыто</span>
                    <span className="text-2xl font-black text-rose-600 mt-1 block font-mono">
                      {tickets.filter(t => t.status === 'open').length}
                    </span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Решено</span>
                    <span className="text-2xl font-black text-amber-500 mt-1 block font-mono">
                      {tickets.filter(t => t.status === 'resolved').length}
                    </span>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Закрыто</span>
                    <span className="text-2xl font-black text-emerald-600 mt-1 block font-mono">
                      {tickets.filter(t => t.status === 'closed').length}
                    </span>
                  </div>
                </div>

                {/* Add Ticket Toggle Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddTicketForm(!showAddTicketForm)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500/30"
                  >
                    {showAddTicketForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{showAddTicketForm ? 'Закрыть форму' : 'Зарегистрировать тикет'}</span>
                  </button>
                </div>

                {/* Registration Form (Collapsible) */}
                <AnimatePresence>
                  {showAddTicketForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                    >
                      <TicketRegistrationForm
                        onSuccess={(newTicket) => {
                          setTickets(prev => [newTicket, ...prev]);
                          setShowAddTicketForm(false);
                        }}
                        onCancel={() => setShowAddTicketForm(false)}
                        supportChannels={supportChannels}
                        supportClients={supportClients}
                        supportCountries={supportCountries}
                        supportStores={supportStores}
                        supportKinds={supportKinds}
                        employees={employees}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Поиск по теме, клиенту или заявителю..."
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 font-semibold"
                      />
                      {ticketSearchQuery && (
                        <button
                          onClick={() => setTicketSearchQuery('')}
                          className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Channel Filter */}
                      <div>
                        <select
                          value={ticketFilterChannel}
                          onChange={(e) => setTicketFilterChannel(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="all">Все каналы</option>
                          {supportChannels.map(c => (
                            <option key={c.id} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <select
                          value={ticketFilterStatus}
                          onChange={(e) => setTicketFilterStatus(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="all">Все статусы</option>
                          <option value="open">Открыт</option>
                          <option value="resolved">Решен</option>
                          <option value="closed">Закрыт</option>
                        </select>
                      </div>

                      {/* Client Filter */}
                      <div>
                        <select
                          value={ticketFilterClient}
                          onChange={(e) => setTicketFilterClient(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="all">Все клиенты</option>
                          {supportClients.map(cl => (
                            <option key={cl.id} value={cl.name}>{cl.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Country Filter */}
                      <div>
                        <select
                          value={ticketFilterCountry}
                          onChange={(e) => setTicketFilterCountry(e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="all">Все страны</option>
                          {Array.from(new Set(supportClients.flatMap(c => c.countries || []))).sort().map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Master-Detail Ticket List */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-sm">
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Список зарегистрированных обращений</h3>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold font-mono">
                        {
                          tickets.filter(t => {
                            const query = ticketSearchQuery.toLowerCase().trim();
                            const matchesSearch = !query || 
                              t.subject.toLowerCase().includes(query) ||
                              t.client.toLowerCase().includes(query) ||
                              t.requesterName.toLowerCase().includes(query) ||
                              t.description.toLowerCase().includes(query);
                            
                            const matchesChannel = ticketFilterChannel === 'all' || t.channel === ticketFilterChannel;
                            const matchesStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
                            const matchesClient = ticketFilterClient === 'all' || t.client === ticketFilterClient;
                            const matchesCountry = ticketFilterCountry === 'all' || t.country === ticketFilterCountry;

                            return matchesSearch && matchesChannel && matchesStatus && matchesClient && matchesCountry;
                          }).length
                        }
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                      {isTicketsLoading ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium">Загрузка обращений...</div>
                      ) : tickets.filter(t => {
                        const query = ticketSearchQuery.toLowerCase().trim();
                        const matchesSearch = !query || 
                          t.subject.toLowerCase().includes(query) ||
                          t.client.toLowerCase().includes(query) ||
                          t.requesterName.toLowerCase().includes(query) ||
                          t.description.toLowerCase().includes(query);
                        
                        const matchesChannel = ticketFilterChannel === 'all' || t.channel === ticketFilterChannel;
                        const matchesStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
                        const matchesClient = ticketFilterClient === 'all' || t.client === ticketFilterClient;
                        const matchesCountry = ticketFilterCountry === 'all' || t.country === ticketFilterCountry;

                        return matchesSearch && matchesChannel && matchesStatus && matchesClient && matchesCountry;
                      }).length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium">Обращений не найдено</div>
                      ) : (
                        tickets
                          .filter(t => {
                            const query = ticketSearchQuery.toLowerCase().trim();
                            const matchesSearch = !query || 
                              t.subject.toLowerCase().includes(query) ||
                              t.client.toLowerCase().includes(query) ||
                              t.requesterName.toLowerCase().includes(query) ||
                              t.description.toLowerCase().includes(query);
                            
                            const matchesChannel = ticketFilterChannel === 'all' || t.channel === ticketFilterChannel;
                            const matchesStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
                            const matchesClient = ticketFilterClient === 'all' || t.client === ticketFilterClient;
                            const matchesCountry = ticketFilterCountry === 'all' || t.country === ticketFilterCountry;

                            return matchesSearch && matchesChannel && matchesStatus && matchesClient && matchesCountry;
                          })
                          .map((t) => {
                            const isSelected = selectedTicketId === t.id;
                            const channelObj = supportChannels.find(ch => ch.code === t.channel);
                            return (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTicketId(t.id)}
                                className={`p-4 transition-all cursor-pointer hover:bg-slate-50 flex flex-col gap-3 ${
                                  isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                      {channelObj?.name || t.channel}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                      {t.client} ({t.country})
                                    </span>
                                    {t.system && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[9px] font-bold">
                                        {t.system}
                                      </span>
                                    )}
                                    {t.module && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[9px] font-bold max-w-[120px] truncate" title={t.module}>
                                        {t.module.replace(/^\([^)]+\)\s*/, '')}
                                      </span>
                                    )}
                                    {t.kind && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[9px] font-bold">
                                        {t.kind}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    {t.status === 'open' && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-extrabold uppercase">Открыт</span>
                                    )}
                                    {t.status === 'resolved' && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold uppercase">Решен</span>
                                    )}
                                    {t.status === 'closed' && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase">Закрыт</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{t.subject}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">{t.description || 'Нет описания'}</p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {t.requesterName} ({t.creatorType === 'store' ? 'Магазин' : 'Офис'})
                                  </span>
                                  <span className="font-mono">
                                    {new Date(t.createdAt).toLocaleDateString('ru-RU')} {new Date(t.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Ticket Detail Sidebar */}
                  <div className="lg:col-span-5">
                    {selectedTicketId ? (() => {
                      const ticket = tickets.find(t => t.id === selectedTicketId);
                      if (!ticket) return <div className="p-6 bg-white border rounded-2xl text-center text-xs text-slate-400">Тикет не найден</div>;
                      const channelObj = supportChannels.find(ch => ch.code === ticket.channel);
                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
                          <div className="p-5 space-y-3.5 bg-slate-50/50">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">ID: {ticket.id.substring(0,8)}</span>
                              <div>
                                {ticket.status === 'open' && (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">Открыт</span>
                                )}
                                {ticket.status === 'resolved' && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider">Решен</span>
                                )}
                                {ticket.status === 'closed' && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">Закрыт</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{ticket.subject}</h3>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase">
                                Канал: {channelObj?.name || ticket.channel}
                              </span>
                              <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                                Клиент: {ticket.client} ({ticket.country})
                              </span>
                              <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                                Источник: {ticket.creatorType === 'store' ? 'Магазин' : 'Офис'}
                              </span>
                              {ticket.storeName && (
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                                  Магазин: {ticket.storeName}
                                </span>
                              )}
                              {ticket.kind && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                                  Вид: {ticket.kind}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-5 space-y-4">
                            {/* Classification details */}
                            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl space-y-2.5 text-xs">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Классификация обращения:</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 font-semibold">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-normal">System:</span>
                                  <span className="text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded text-[11px] inline-block font-mono">{ticket.system || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-normal">Module:</span>
                                  <span className="text-slate-700 text-[11px] inline-block truncate max-w-[140px]">{ticket.module || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-normal">Type:</span>
                                  <span className="text-slate-700 text-[11px] inline-block truncate max-w-[140px]">{ticket.type || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-normal">Action:</span>
                                  <span className="text-indigo-600 text-[11px] inline-block truncate max-w-[140px] font-bold">{ticket.action || '—'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Описание обращения:</span>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                                {ticket.description || 'Без описания'}
                              </div>
                            </div>

                            {/* Ticket Attachments list */}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Прикрепленные файлы ({ticket.attachments.length}):</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {ticket.attachments.map((file, fIdx) => (
                                    <div key={fIdx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded-xl">
                                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                                        {file.type.startsWith('image/') ? (
                                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-slate-200 flex-shrink-0">
                                            <img src={file.url} alt={file.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                        )}
                                        <div className="overflow-hidden">
                                          <p className="text-[11px] font-bold text-slate-600 truncate" title={file.name}>
                                            {file.name}
                                          </p>
                                          <p className="text-[9px] text-slate-400 font-semibold">
                                            {(file.size / 1024).toFixed(1)} KB
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        {/* Download Button */}
                                        <a
                                          href={file.url}
                                          download={file.name}
                                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                          title="Скачать"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-3.5">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Заявитель:</span>
                                <span className="font-semibold text-slate-800 block mt-0.5">{ticket.requesterName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Тип обращения:</span>
                                <span className="font-semibold text-slate-800 block mt-0.5">
                                  {ticket.creatorType === 'store' ? `Магазин: ${ticket.storeName || 'не указан'}` : 'Офис (выбор магазина не требуется)'}
                                </span>
                              </div>
                            </div>

                            {/* Timeline & Metadata Section */}
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Реквизиты и Жизненный цикл тикета</span>
                                {!isEditingTicketMeta ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditCreatedAt(formatIsoToDatetimeLocal(ticket.createdAt));
                                      setEditStartedWorkingAt(formatIsoToDatetimeLocal(ticket.startedWorkingAt));
                                      setEditClosedAt(formatIsoToDatetimeLocal(ticket.closedAt));
                                      setEditConfirmedAt(formatIsoToDatetimeLocal(ticket.confirmedAt));
                                      setEditConfirmationAttachment(ticket.confirmationAttachment || null);
                                      setIsEditingTicketMeta(true);
                                    }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Изменить реквизиты
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingTicketMeta(false)}
                                      className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                                    >
                                      Отмена
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTicketMeta(ticket.id)}
                                      className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      Сохранить
                                    </button>
                                  </div>
                                )}
                              </div>

                              {!isEditingTicketMeta ? (
                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 text-xs space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">1. Время и дата заявки:</span>
                                      <span className="font-semibold text-slate-700 block mt-0.5">
                                        {ticket.createdAt ? `${new Date(ticket.createdAt).toLocaleDateString('ru-RU')} ${new Date(ticket.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : '--'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">2. Начало работы над тикетом:</span>
                                      <span className="font-semibold text-slate-700 block mt-0.5">
                                        {ticket.startedWorkingAt ? `${new Date(ticket.startedWorkingAt).toLocaleDateString('ru-RU')} ${new Date(ticket.startedWorkingAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : <span className="text-rose-500 font-bold">Не начато</span>}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">3. Время и дата закрытия:</span>
                                      <span className="font-semibold text-slate-700 block mt-0.5">
                                        {ticket.closedAt ? `${new Date(ticket.closedAt).toLocaleDateString('ru-RU')} ${new Date(ticket.closedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : <span className="text-slate-400 font-bold">Не закрыт</span>}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">4. Подтверждение клиента:</span>
                                      <span className="font-semibold text-slate-700 block mt-0.5">
                                        {ticket.confirmedAt ? `${new Date(ticket.confirmedAt).toLocaleDateString('ru-RU')} ${new Date(ticket.confirmedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : <span className="text-slate-400 italic">Нет подтверждения</span>}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="border-t border-slate-200/60 pt-2.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Скриншот подтверждения от клиента:</span>
                                    {ticket.confirmationAttachment ? (
                                      <div className="mt-1 flex items-center gap-2 p-2 bg-white border rounded-xl">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-slate-100 shrink-0">
                                          <img src={ticket.confirmationAttachment.url} alt="Подтверждение" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden">
                                          <p className="text-[11px] font-bold text-slate-700 truncate">{ticket.confirmationAttachment.name}</p>
                                          <a 
                                            href={ticket.confirmationAttachment.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5 mt-0.5"
                                          >
                                            <span>Открыть оригинал</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic block mt-0.5">Скриншот подтверждения не прикреплен</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/60 text-xs space-y-3.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Время и дата заявки</label>
                                      <input
                                        type="datetime-local"
                                        value={editCreatedAt}
                                        onChange={(e) => setEditCreatedAt(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Время начала работы</label>
                                      <input
                                        type="datetime-local"
                                        value={editStartedWorkingAt}
                                        onChange={(e) => setEditStartedWorkingAt(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">3. Время и дата закрытия</label>
                                      <input
                                        type="datetime-local"
                                        value={editClosedAt}
                                        onChange={(e) => setEditClosedAt(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">4. Подтверждение клиента</label>
                                      <input
                                        type="datetime-local"
                                        value={editConfirmedAt}
                                        onChange={(e) => setEditConfirmedAt(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Прикрепить скриншот подтверждения</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handleConfirmationFileAttachment(e.target.files[0]);
                                          }
                                        }}
                                        className="text-xs text-slate-500"
                                      />
                                    </div>
                                    {editConfirmationAttachment && (
                                      <div className="mt-2 flex items-center gap-2 p-2 bg-white border rounded-xl">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-slate-55 shadow-inner">
                                          <img src={editConfirmationAttachment.url} alt="Превью" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                          <p className="text-[10px] text-slate-600 truncate font-bold">{editConfirmationAttachment.name}</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setEditConfirmationAttachment(null)}
                                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-indigo-50/40 p-4 border border-indigo-100/80 rounded-xl space-y-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Ответственный исполнитель:</span>
                                {ticket.status === 'open' && !ticket.assignedToId && (
                                  <button
                                    onClick={() => handleTakeTicket(ticket.id)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer"
                                  >
                                    Взять себе
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                                <select
                                  value={ticket.assignedToId || ''}
                                  onChange={(e) => {
                                    const selectedId = e.target.value;
                                    if (!selectedId) {
                                      handleAssignTicket(ticket.id, '', '');
                                    } else {
                                      const emp = employees.find(e => e.id === selectedId);
                                      const name = emp ? emp.name : ticket.assignedToName || '';
                                      handleAssignTicket(ticket.id, selectedId, name);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                                >
                                  <option value="">— Не назначен —</option>
                                  {(() => {
                                    const selectOptions = employees.filter(emp => emp.status === 'active');
                                    if (ticket.assignedToId && !selectOptions.some(emp => emp.id === ticket.assignedToId)) {
                                      selectOptions.push({
                                        id: ticket.assignedToId,
                                        name: ticket.assignedToName || ticket.assignedToId,
                                        status: 'active',
                                        role: 'employee' as any,
                                        createdAt: '',
                                        email: '',
                                        password: '',
                                        profile: {} as any
                                      });
                                    }
                                    return selectOptions.map(emp => (
                                      <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.profile?.positionName || (emp.role === 'admin' ? 'Администратор' : 'Специалист')})
                                      </option>
                                    ));
                                  })()}
                                </select>
                              </div>
                            </div>
                          </div>

                          {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                            <div className="p-5 space-y-2 bg-emerald-50/20 border-t border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Решение вопроса:</span>
                              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
                                {ticket.resolutionComment || 'Решено без комментария'}
                              </div>
                              {(ticket.resolvedAt || ticket.closedAt) && (
                                <div className="text-[9px] text-slate-400 font-mono mt-1 text-right">
                                  {ticket.resolvedAt && `Решено: ${new Date(ticket.resolvedAt).toLocaleDateString('ru-RU')}`}
                                  {ticket.closedAt && ` | Закрыто: ${new Date(ticket.closedAt).toLocaleDateString('ru-RU')}`}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="p-5 flex flex-wrap gap-2 justify-between items-center bg-slate-50/30">
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Удалить</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {ticket.status === 'open' && ticket.assignedToId && (
                                <div className="w-full space-y-3 pt-3">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Комментарий о решении *</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Как решен вопрос..."
                                      value={ticketResolutionComment}
                                      onChange={(e) => setTicketResolutionComment(e.target.value)}
                                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    />
                                    <button
                                      onClick={() => {
                                        if (!ticketResolutionComment.trim()) {
                                          alert('Введите комментарий о решении!');
                                          return;
                                        }
                                        handleUpdateTicketStatus(ticket.id, 'resolved', ticketResolutionComment);
                                      }}
                                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                                    >
                                      Решить
                                    </button>
                                  </div>
                                </div>
                              )}

                              {ticket.status === 'resolved' && (
                                <button
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'closed')}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  Закрыть тикет окончательно
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="bg-slate-100/50 border border-dashed border-slate-200 p-8 rounded-2xl text-center text-xs text-slate-400 font-medium">
                        Выберите тикет из списка слева, чтобы просмотреть подробности.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Support Channels Tab */}
            {ticketAcademySubTab === 'channels' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-sm">
                {/* Form to add or edit channel */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingChannelId ? 'Редактировать канал связи' : 'Добавить новый канал связи'}
                  </h3>
                  <form onSubmit={editingChannelId ? handleUpdateChannel : handleCreateChannel} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Код канала (строка, без пробелов) *</label>
                      <input
                        type="text"
                        placeholder="Например: telegram, email, teams, portal"
                        value={editingChannelId ? editingChannelCode : newChannelCode}
                        onChange={(e) => editingChannelId ? setEditingChannelCode(e.target.value) : setNewChannelCode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        required
                        disabled={!!editingChannelId}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Отображаемое название *</label>
                      <input
                        type="text"
                        placeholder="Например: Telegram каналы, Почта"
                        value={editingChannelId ? editingChannelName : newChannelName}
                        onChange={(e) => editingChannelId ? setEditingChannelName(e.target.value) : setNewChannelName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      {editingChannelId && (
                        <button
                          type="button"
                          onClick={() => setEditingChannelId(null)}
                          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {editingChannelId ? 'Сохранить изменения' : 'Добавить'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Channels */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Зарегистрированные каналы связи</h3>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {supportChannels.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4">Код канала</th>
                          <th className="p-4">Название канала</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {supportChannels.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/40">
                            <td className="p-4 font-mono font-bold text-slate-500">{c.code}</td>
                            <td className="p-4 font-extrabold text-slate-900">{c.name}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingChannelId(c.id);
                                    setEditingChannelCode(c.code);
                                    setEditingChannelName(c.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChannel(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {supportChannels.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">Список каналов связи пуст</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Support Clients Tab */}
            {ticketAcademySubTab === 'clients' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-sm">
                {/* Form to add or edit client */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingClientId ? 'Редактировать клиента' : 'Добавить нового клиента'}
                  </h3>
                  <form onSubmit={editingClientId ? handleUpdateClient : handleCreateClient} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Название клиента *</label>
                      <input
                        type="text"
                        placeholder="Например: Koton, LCW, Mittivoj"
                        value={editingClientId ? editingClientName : newClientName}
                        onChange={(e) => editingClientId ? setEditingClientName(e.target.value) : setNewClientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        required
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Страны присутствия *</span>
                      
                      {/* Selected Countries Tags */}
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px] mb-3">
                        {((editingClientId ? editingClientCountries : newClientCountries) || []).length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic self-center px-1">Страны не выбраны</span>
                        ) : (
                          ((editingClientId ? editingClientCountries : newClientCountries) || []).map(country => (
                            <span 
                              key={country} 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100"
                            >
                              <span>{country}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingClientId) {
                                    setEditingClientCountries(prev => prev.filter(c => c !== country));
                                  } else {
                                    setNewClientCountries(prev => prev.filter(c => c !== country));
                                  }
                                }}
                                className="hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Quick Select Common Countries */}
                      <div className="mb-3">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Быстрый выбор:</span>
                        <div className="flex flex-wrap gap-1">
                          {(supportCountries.length > 0 ? supportCountries.map(c => c.name) : ['Россия', 'Казахстан', 'Беларусь', 'Узбекистан', 'Кыргызстан', 'Таджикистан', 'Армения', 'Азербайджан', 'Турция', 'Грузия']).map(country => {
                            const isSelected = (editingClientId ? editingClientCountries : newClientCountries).includes(country);
                            return (
                              <button
                                key={country}
                                type="button"
                                onClick={() => {
                                  if (editingClientId) {
                                    if (isSelected) {
                                      setEditingClientCountries(prev => prev.filter(c => c !== country));
                                    } else {
                                      setEditingClientCountries(prev => [...prev, country]);
                                    }
                                  } else {
                                    if (isSelected) {
                                      setNewClientCountries(prev => prev.filter(c => c !== country));
                                    } else {
                                      setNewClientCountries(prev => [...prev, country]);
                                    }
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {country}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Add Custom Country Input */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Другая страна..."
                          value={editingClientId ? customEditCountry : customNewCountry}
                          onChange={(e) => editingClientId ? setCustomEditCountry(e.target.value) : setCustomNewCountry(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (editingClientId ? customEditCountry : customNewCountry).trim();
                              if (!val) return;
                              if (editingClientId) {
                                if (!editingClientCountries.includes(val)) {
                                  setEditingClientCountries(prev => [...prev, val]);
                                }
                                setCustomEditCountry('');
                              } else {
                                if (!newClientCountries.includes(val)) {
                                  setNewClientCountries(prev => [...prev, val]);
                                }
                                setCustomNewCountry('');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = (editingClientId ? customEditCountry : customNewCountry).trim();
                            if (!val) return;
                            if (editingClientId) {
                              if (!editingClientCountries.includes(val)) {
                                setEditingClientCountries(prev => [...prev, val]);
                              }
                              setCustomEditCountry('');
                            } else {
                              if (!newClientCountries.includes(val)) {
                                setNewClientCountries(prev => [...prev, val]);
                              }
                              setCustomNewCountry('');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      {editingClientId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClientId(null);
                            setEditingClientName('');
                            setEditingClientCountries([]);
                          }}
                          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {editingClientId ? 'Сохранить изменения' : 'Добавить'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Clients */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Зарегистрированные клиенты и страны</h3>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {supportClients.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4">Название</th>
                          <th className="p-4">География / Страны присутствия</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {supportClients.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/40">
                            <td className="p-4 font-extrabold text-slate-900">{c.name}</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {(c.countries || []).map(country => (
                                  <span key={country} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100/50">
                                    {country}
                                  </span>
                                ))}
                                {(!c.countries || c.countries.length === 0) && (
                                  <span className="text-slate-400 text-xs font-semibold">Не указаны</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingClientId(c.id);
                                    setEditingClientName(c.name);
                                    setEditingClientCountries(c.countries || []);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClient(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {supportClients.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">Список клиентов пуст</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Support Stores Tab */}
            {ticketAcademySubTab === 'stores' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-sm">
                {/* Form to add or edit store */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingStoreId ? 'Редактировать магазин' : 'Добавить новый магазин'}
                  </h3>
                  <form onSubmit={editingStoreId ? handleUpdateStore : handleCreateStore} className="space-y-4">
                    {/* Select Client */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Клиент *</label>
                      <select
                        value={editingStoreId ? editingStoreClientId : newStoreClientId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (editingStoreId) {
                            setEditingStoreClientId(val);
                            // Auto-select first country of the chosen client
                            const chosen = supportClients.find(c => c.id === val);
                            if (chosen && chosen.countries && chosen.countries.length > 0) {
                              setEditingStoreCountry(chosen.countries[0]);
                            } else {
                              setEditingStoreCountry('');
                            }
                          } else {
                            setNewStoreClientId(val);
                            const chosen = supportClients.find(c => c.id === val);
                            if (chosen && chosen.countries && chosen.countries.length > 0) {
                              setNewStoreCountry(chosen.countries[0]);
                            } else {
                              setNewStoreCountry('');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Выберите клиента --</option>
                        {supportClients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Country (Context-aware based on chosen client) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Страна присутствия *</label>
                      <select
                        value={editingStoreId ? editingStoreCountry : newStoreCountry}
                        onChange={(e) => editingStoreId ? setEditingStoreCountry(e.target.value) : setNewStoreCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        required
                      >
                        <option value="">-- Выберите страну --</option>
                        {(() => {
                          const currentClientId = editingStoreId ? editingStoreClientId : newStoreClientId;
                          const clientObj = supportClients.find(cl => cl.id === currentClientId);
                          if (!clientObj || !clientObj.countries) return null;
                          return clientObj.countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* Store Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Название магазина *</label>
                      <input
                        type="text"
                        placeholder="Например: LCW Мега Химки, Koton Авиапарк"
                        value={editingStoreId ? editingStoreName : newStoreName}
                        onChange={(e) => editingStoreId ? setEditingStoreName(e.target.value) : setNewStoreName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        required
                      />
                    </div>

                    {/* Store Code / Number */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Номер / Код магазина</label>
                      <input
                        type="text"
                        placeholder="Например: M0453, RU05"
                        value={editingStoreId ? editingStoreCode : newStoreCode}
                        onChange={(e) => editingStoreId ? setEditingStoreCode(e.target.value) : setNewStoreCode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>

                    {/* Store Status */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Статус магазина</label>
                      <select
                        value={editingStoreId ? editingStoreStatus : newStoreStatus}
                        onChange={(e) => {
                          const val = e.target.value as 'active' | 'closed';
                          if (editingStoreId) {
                            setEditingStoreStatus(val);
                          } else {
                            setNewStoreStatus(val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="active">Активный</option>
                        <option value="closed">Закрыт</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingStoreId && (
                        <button
                          type="button"
                          onClick={() => setEditingStoreId(null)}
                          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {editingStoreId ? 'Сохранить изменения' : 'Добавить'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Stores */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Зарегистрированные магазины</h3>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {supportStores.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4">Название магазина</th>
                          <th className="p-4">Номер магазина</th>
                          <th className="p-4">Клиент</th>
                          <th className="p-4">Страна</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {supportStores.map(s => {
                          const clientObj = supportClients.find(c => c.id === s.clientId);
                          const isClosed = s.status === 'closed';
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/40">
                              <td className="p-4 font-extrabold text-slate-900">{s.name}</td>
                              <td className="p-4 font-mono text-slate-500 font-semibold">{s.code || '—'}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                                  {clientObj?.name || 'Загрузка...'}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-slate-600">{s.country}</td>
                              <td className="p-4">
                                {isClosed ? (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100/50 text-[11px] font-bold">
                                    Закрыт
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[11px] font-bold">
                                    Активный
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStoreId(s.id);
                                      setEditingStoreName(s.name);
                                      setEditingStoreClientId(s.clientId);
                                      setEditingStoreCountry(s.country);
                                      setEditingStoreCode(s.code || '');
                                      setEditingStoreStatus(s.status || 'active');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStore(s.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {supportStores.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Список магазинов пуст</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Support Kinds Tab */}
            {ticketAcademySubTab === 'kinds' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-sm">
                {/* Form to add or edit kind */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingKindId ? 'Редактировать вид тикета' : 'Добавить новый вид тикета'}
                  </h3>
                  <form onSubmit={editingKindId ? handleUpdateKind : handleCreateKind} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название вида тикета *</label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Ошибка системы"
                        value={editingKindId ? editingKindName : newKindName}
                        onChange={(e) => {
                          if (editingKindId) {
                            setEditingKindName(e.target.value);
                          } else {
                            setNewKindName(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingKindId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKindId(null);
                            setEditingKindName('');
                          }}
                          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {editingKindId ? 'Сохранить изменения' : 'Добавить'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Kinds */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Зарегистрированные виды тикетов</h3>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {supportKinds.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4">Название вида</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {supportKinds.map(kind => (
                          <tr key={kind.id} className="hover:bg-slate-50/40">
                            <td className="p-4 font-extrabold text-slate-900">{kind.name}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingKindId(kind.id);
                                    setEditingKindName(kind.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKind(kind.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {supportKinds.length === 0 && (
                          <tr>
                            <td colSpan={2} className="p-8 text-center text-slate-400 font-semibold">Список видов тикетов пуст</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Support Countries Tab */}
            {ticketAcademySubTab === 'countries' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-sm">
                {/* Form to add or edit country */}
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    {editingCountryId ? 'Редактировать страну' : 'Добавить новую страну'}
                  </h3>
                  <form onSubmit={editingCountryId ? handleUpdateCountry : handleCreateCountry} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Код страны (ISO 2 букв) *</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="Например: KZ, RU, UZ, GE"
                        value={editingCountryId ? editingCountryCode : newCountryCode}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          if (editingCountryId) {
                            setEditingCountryCode(val);
                          } else {
                            setNewCountryCode(val);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Название страны *</label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Казахстан, Россия"
                        value={editingCountryId ? editingCountryName : newCountryName}
                        onChange={(e) => {
                          if (editingCountryId) {
                            setEditingCountryName(e.target.value);
                          } else {
                            setNewCountryName(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingCountryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCountryId(null);
                            setEditingCountryCode('');
                            setEditingCountryName('');
                          }}
                          className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Отмена
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        {editingCountryId ? 'Сохранить изменения' : 'Добавить'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of Countries */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Справочник стран</h3>
                    <span className="text-xs font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {supportCountries.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20">
                          <th className="p-4 w-24">Код</th>
                          <th className="p-4">Название страны</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {supportCountries.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/40">
                            <td className="p-4 font-mono font-bold text-indigo-700">
                              <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-[11px]">
                                {c.code}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900">{c.name}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCountryId(c.id);
                                    setEditingCountryCode(c.code);
                                    setEditingCountryName(c.name);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCountry(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {supportCountries.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">Справочник стран пуст</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {ticketAcademySubTab === 'categories' && (
              <TicketCategoryManager />
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <TicketReports
            tickets={tickets}
            supportClients={supportClients}
            supportStores={supportStores}
            supportKinds={supportKinds}
            employees={employees}
          />
        )}
      </main>
    </div>

      {/* Edit Employee Modal Overlay */}
      <AnimatePresence>
        {editingEmployee && (
          <div id="edit-modal" className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            >
              <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-teal-600" />
                    Редактировать профиль сотрудника
                  </h3>
                  <button type="button" onClick={() => setEditingEmployee(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ФИО сотрудника *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Подразделение *</label>
                      <select
                        value={editDepartment}
                        onChange={(e) => handleEditDepartmentChange(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm bg-white cursor-pointer font-medium text-slate-800"
                      >
                        {dbDepartments.map(dept => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Должность в компании *</label>
                      <select
                        value={editPositionCode}
                        onChange={(e) => handleEditPositionChange(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm bg-white cursor-pointer font-medium text-slate-800"
                      >
                        {dbPositions.filter(pos => {
                          const currentDept = dbDepartments.find(d => d.name === editDepartment);
                          return pos.departmentId === currentDept?.id;
                        }).map(pos => (
                          <option key={pos.code} value={pos.code}>
                            [{pos.code}] {pos.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Контактный телефон</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Роль в системе (автоопределение)</label>
                      <div className="w-full px-3.5 py-2 bg-slate-50 border rounded-lg text-slate-600 text-sm font-medium flex items-center gap-1.5 h-[38px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          editRole === 'admin' ? 'bg-red-500 animate-pulse' :
                          editRole === 'manager' ? 'bg-indigo-500' :
                          'bg-slate-450'
                        }`} />
                        <span>
                          {editRole === 'admin' ? 'Администратор (Admin)' :
                           editRole === 'manager' ? 'Менеджер (Manager)' :
                           'Сотрудник (Employee)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const selectedPositionObj = dbPositions.find(p => p.code === editPositionCode);
                    if (selectedPositionObj?.ranks && selectedPositionObj.ranks.length > 0) {
                      return (
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Ранг в должности *</label>
                            <select
                              value={editRank}
                              onChange={(e) => setEditRank(e.target.value)}
                              className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm bg-white cursor-pointer font-medium text-slate-800"
                              required
                            >
                              <option value="">Выберите ранг</option>
                              {selectedPositionObj.ranks.map((rankOpt) => (
                                <option key={rankOpt} value={rankOpt}>
                                  {rankOpt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Специализации (через запятую)</label>
                    <input
                      type="text"
                      value={editSpecString}
                      onChange={(e) => setEditSpecString(e.target.value)}
                      className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      placeholder="Linux, CRM, API"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Краткая информация / Описание</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                  >
                    {isUpdating ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Сохранить изменения
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div id="delete-modal" className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Удалить сотрудника?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Это действие необратимо. Персональный аккаунт сотрудника, его профиль и все доступы будут немедленно удалены.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Отмена
                </button>
                <button
                  id="confirm-delete-btn"
                  onClick={() => handleDeleteEmployee(deletingId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Подтвердить удаление
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-out Email Simulator Drawer */}
      <AnimatePresence>
        {showEmailSimulator && (
          <div id="email-sim-drawer" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmailSimulator(false)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Panel */}
            <motion.div
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-slate-900 border-l border-slate-800 text-slate-100 h-full shadow-2xl relative flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">Имитатор Email-сервера</h3>
                    <p className="text-[10px] text-slate-400">Список отправленных приглашений на почту</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailSimulator(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Main Body (Split List / View) */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedEmail ? (
                  /* Expanded Email Detail View */
                  <div className="flex-1 overflow-y-auto flex flex-col bg-slate-950">
                    <div className="p-4 border-b border-slate-800 bg-slate-900">
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mb-3"
                      >
                        ← Вернуться к списку писем
                      </button>
                      <h4 className="font-bold text-base text-white">{selectedEmail.subject}</h4>
                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        <div>Кому: <span className="text-teal-300 font-mono">{selectedEmail.to}</span></div>
                        <div>Отправлено: <span className="font-mono">{new Date(selectedEmail.sentAt).toLocaleString()}</span></div>
                      </div>
                    </div>

                    {/* Email body visual mockup */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="bg-white text-slate-850 p-6 rounded-xl border border-slate-200 shadow-lg text-xs leading-relaxed max-w-md mx-auto w-full font-sans">
                        <div className="border-b pb-4 mb-4 flex items-center justify-between">
                          <span className="font-bold text-teal-700 tracking-tight">SUPPORT PLATFORM</span>
                          <span className="text-[10px] text-slate-400">Системное уведомление</span>
                        </div>
                        
                        <p className="whitespace-pre-line text-slate-700">{selectedEmail.body}</p>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center">
                          <button
                            id="activate-from-email-btn"
                            type="button"
                            onClick={() => handleOpenEmailInOnboarding(selectedEmail)}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-center flex items-center justify-center gap-2 shadow hover:shadow-md transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Активировать мой аккаунт
                          </button>
                          <span className="text-[9px] text-slate-400 mt-2 text-center">
                            Вы будете перенаправлены на форму ввода персонального пароля.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Email Inbox List */
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {simulatedEmails.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Писем не отправлено</p>
                        <p className="text-[10px] text-slate-600 mt-1">Добавьте сотрудника для генерации писем.</p>
                      </div>
                    ) : (
                      simulatedEmails.map((emailObj) => (
                        <div
                          key={emailObj.id}
                          onClick={() => setSelectedEmail(emailObj)}
                          className={`p-3 rounded-xl text-left border cursor-pointer transition-all ${
                            emailObj.status === 'sent'
                              ? 'bg-slate-800 border-teal-500/30 hover:border-teal-500/60 hover:bg-slate-750'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate max-w-[200px]">{emailObj.to}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(emailObj.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs text-teal-400 mt-1 truncate">{emailObj.subject}</div>
                          <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1 italic font-mono bg-slate-950/40 p-1.5 rounded">
                            {emailObj.body.split('\n\n')[2]}
                          </p>
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-800/40">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              emailObj.status === 'sent' ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {emailObj.status === 'sent' ? 'Новое письмо' : 'Прочитано'}
                            </span>
                            <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1 group-hover:underline">
                              Посмотреть письмо
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
