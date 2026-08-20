/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Phone, User, LogOut, CheckCircle2, Award, 
  HelpCircle, ChevronRight, Edit3, Check, Save, Tag, Plus, X, Globe, Star,
  FileText, Video, ExternalLink, Ticket as TicketIcon, Search, AlertTriangle, Trash2, Paperclip
} from 'lucide-react';
import { Employee, Course, Lesson, LessonGrade, Ticket, TicketChannel, TicketStatus, TicketCreatorType, SupportClient, SupportStore, SupportKind, SupportChannel, SupportCountry } from '../types';
import { TICKET_CATEGORIES } from '../ticketCategories';
import { VoiceTicketRecorder } from './VoiceTicketRecorder';
import { ImageTicketAnalyzer } from './ImageTicketAnalyzer';
import { TicketRegistrationForm } from './TicketRegistrationForm';

interface EmployeeDashboardProps {
  employee: Employee;
  onLogout: () => void;
  onProfileUpdate: (updatedUser: Employee) => void;
}

export default function EmployeeDashboard({ employee, onLogout, onProfileUpdate }: EmployeeDashboardProps) {
  const [profile, setProfile] = useState(employee);
  const [editMode, setEditMode] = useState(false);
  
  // Editable form fields
  const [phone, setPhone] = useState(employee.profile.phone || '');
  const [bio, setBio] = useState(employee.profile.bio || '');
  const [specInput, setSpecInput] = useState('');
  const [specs, setSpecs] = useState<string[]>(employee.profile.specializations || []);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Real Courses and Lessons State
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`completed_lessons_${employee.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Grades / Evaluations State
  const [grades, setGrades] = useState<LessonGrade[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  // Ticket Academy State
  const [activeModule, setActiveModule] = useState<'learning' | 'tickets'>('learning');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketFilterChannel, setTicketFilterChannel] = useState('all');
  const [ticketFilterStatus, setTicketFilterStatus] = useState('all');
  const [ticketFilterClient, setTicketFilterClient] = useState('all');
  const [ticketFilterCountry, setTicketFilterCountry] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showAddTicketForm, setShowAddTicketForm] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState('');

  const getCurrentDatetimeLocal = () => {
    try {
      const date = new Date();
      const tzoffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // Ticket Form Fields State
  const [newTicketChannel, setNewTicketChannel] = useState<TicketChannel>('telegram');
  const [newTicketClient, setNewTicketClient] = useState('');
  const [newTicketCountry, setNewTicketCountry] = useState('');
  const [newTicketCreatorType, setNewTicketCreatorType] = useState<TicketCreatorType>('store');
  const [newTicketStoreId, setNewTicketStoreId] = useState('');
  const [newTicketStoreName, setNewTicketStoreName] = useState('');
  const [newTicketRequesterName, setNewTicketRequesterName] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketKind, setNewTicketKind] = useState('');
  const [newTicketSystem, setNewTicketSystem] = useState('');
  const [newTicketModule, setNewTicketModule] = useState('');
  const [newTicketType, setNewTicketType] = useState('');
  const [newTicketAction, setNewTicketAction] = useState('');
  const [ticketResolutionComment, setTicketResolutionComment] = useState('');
  const [newTicketAttachments, setNewTicketAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [newTicketCreatedAt, setNewTicketCreatedAt] = useState(getCurrentDatetimeLocal());
  const [newTicketStartedWorkingAt, setNewTicketStartedWorkingAt] = useState('');
  const [newTicketClosedAt, setNewTicketClosedAt] = useState('');
  const [newTicketConfirmedAt, setNewTicketConfirmedAt] = useState('');
  const [newTicketResolutionComment, setNewTicketResolutionComment] = useState('');
  const [newTicketConfirmationAttachment, setNewTicketConfirmationAttachment] = useState<{ name: string; size: number; type: string; url: string } | null>(null);
  const [newTicketAssignedToId, setNewTicketAssignedToId] = useState('');
  const [newTicketAssignedToName, setNewTicketAssignedToName] = useState('');

  // Metadata editing state for existing ticket
  const [isEditingTicketMeta, setIsEditingTicketMeta] = useState(false);
  const [editCreatedAt, setEditCreatedAt] = useState('');
  const [editStartedWorkingAt, setEditStartedWorkingAt] = useState('');
  const [editClosedAt, setEditClosedAt] = useState('');
  const [editConfirmedAt, setEditConfirmedAt] = useState('');
  const [editConfirmationAttachment, setEditConfirmationAttachment] = useState<{ name: string; size: number; type: string; url: string } | null>(null);

  const registerCourseStart = async (courseId: string) => {
    const currentStarts = profile.profile?.courseStartedDates || {};
    if (currentStarts[courseId]) return; // Already registered

    const updatedStarts = {
      ...currentStarts,
      [courseId]: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/employees/${profile.id}`, {
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
        const data = await response.json();
        setProfile(data);
        onProfileUpdate(data);
      }
    } catch (err) {
      console.error('Failed to register course start', err);
    }
  };

  // DB client/store states
  const [supportClients, setSupportClients] = useState<SupportClient[]>([]);
  const [supportStores, setSupportStores] = useState<SupportStore[]>([]);
  const [supportKinds, setSupportKinds] = useState<SupportKind[]>([]);
  const [supportChannels, setSupportChannels] = useState<SupportChannel[]>([]);
  const [supportCountries, setSupportCountries] = useState<SupportCountry[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);

  const fetchSupportChannels = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-channels', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportChannels(data);
      }
    } catch (err) {
      console.error('Failed to fetch support channels', err);
    }
  };

  const fetchSupportCountries = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-countries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportCountries(data);
      }
    } catch (err) {
      console.error('Failed to fetch support countries', err);
    }
  };

  const fetchActiveEmployees = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/employees/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveEmployees(data);
      }
    } catch (err) {
      console.error('Failed to fetch active employees', err);
    }
  };

  const fetchSupportClients = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch support clients', err);
    }
  };

  const fetchSupportKinds = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-kinds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportKinds(data);
      }
    } catch (err) {
      console.error('Failed to fetch support kinds', err);
    }
  };

  const fetchSupportStores = async () => {
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/support-stores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportStores(data);
      }
    } catch (err) {
      console.error('Failed to fetch support stores', err);
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
    setTicketError('');
    setTicketSuccessMsg('');
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
      setTicketSuccessMsg('Дополнительные реквизиты тикета успешно обновлены!');
      setIsEditingTicketMeta(false);
    } catch (err: any) {
      setTicketError(err.message);
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

  const fetchTickets = async () => {
    setIsTicketsLoading(true);
    try {
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
      console.error('Failed to fetch tickets', err);
    } finally {
      setIsTicketsLoading(false);
    }
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
    if (!newTicketClient) {
      setTicketError('Пожалуйста, выберите клиента!');
      return;
    }
    if (newTicketCreatorType === 'store' && !newTicketStoreId) {
      setTicketError('Пожалуйста, выберите магазин!');
      return;
    }
    if (!newTicketSubject.trim()) {
      setTicketError('Пожалуйста, укажите тему обращения!');
      return;
    }
    if (!newTicketSystem || !newTicketModule || !newTicketType) {
      setTicketError('Пожалуйста, укажите классификацию обращения (System, Module, Type)!');
      return;
    }

    setIsSubmittingTicket(true);
    setTicketError('');
    setTicketSuccessMsg('');

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
        throw new Error(data.error || 'Ошибка при создании обращения');
      }

      setTickets([data, ...tickets]);
      setSelectedTicketId(data.id);
      setTicketSuccessMsg('Обращение успешно зарегистрировано в Ticket Academy!');
      setShowAddTicketForm(false);
      
      // Reset form
      setNewTicketClient('');
      setNewTicketRequesterName('');
      setNewTicketSubject('');
      setNewTicketDescription('');
      setNewTicketKind('');
      setNewTicketSystem('');
      setNewTicketModule('');
      setNewTicketType('');
      setNewTicketAction('');
      setNewTicketStoreId('');
      setNewTicketStoreName('');
      setNewTicketAttachments([]);
      setNewTicketAssignedToId('');
      setNewTicketAssignedToName('');
      setNewTicketCreatedAt(getCurrentDatetimeLocal());
      setNewTicketStartedWorkingAt('');
      setNewTicketClosedAt('');
      setNewTicketConfirmedAt('');
      setNewTicketResolutionComment('');
      setNewTicketConfirmationAttachment(null);
    } catch (err: any) {
      setTicketError(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    setTicketError('');
    setTicketSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}/take`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось взять обращение в работу');
      }

      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      setTicketSuccessMsg('Вы успешно назначены ответственным по данному обращению!');
    } catch (err: any) {
      setTicketError(err.message);
    }
  };

  const handleAssignTicket = async (ticketId: string, employeeId: string, employeeName: string) => {
    setTicketError('');
    setTicketSuccessMsg('');
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
      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      setTicketSuccessMsg(employeeId ? `Исполнитель успешно назначен: ${employeeName}` : 'Назначение исполнителя снято');
    } catch (err: any) {
      setTicketError(err.message);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'resolved' | 'closed', comment?: string) => {
    setTicketError('');
    setTicketSuccessMsg('');
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, resolutionComment: comment })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось обновить статус обращения');
      }

      setTickets(tickets.map(t => t.id === ticketId ? data : t));
      setTicketResolutionComment('');
      setTicketSuccessMsg(status === 'resolved' ? 'Обращение успешно переведено в статус Решено!' : 'Обращение успешно закрыто!');
    } catch (err: any) {
      setTicketError(err.message);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Вы действительно хотите безвозвратно удалить это обращение?')) return;
    setTicketError('');
    setTicketSuccessMsg('');
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
        throw new Error(data.error || 'Не удалось удалить обращение');
      }

      setTickets(tickets.filter(t => t.id !== ticketId));
      setSelectedTicketId(null);
      setTicketSuccessMsg('Обращение было успешно удалено.');
    } catch (err: any) {
      setTicketError(err.message);
    }
  };

  const fetchGrades = async () => {
    setGradesLoading(true);
    try {
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
      console.error('Failed to fetch grades', err);
    } finally {
      setGradesLoading(false);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchGrades();
    fetchTickets();
    fetchSupportClients();
    fetchSupportStores();
    fetchSupportKinds();
    fetchSupportChannels();
    fetchSupportCountries();
    fetchActiveEmployees();
  }, []);

  const toggleLessonCompleted = (lessonId: string) => {
    const isCompleted = completedLessons.includes(lessonId);
    let updated: string[];
    if (isCompleted) {
      updated = completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...completedLessons, lessonId];
    }
    setCompletedLessons(updated);
    localStorage.setItem(`completed_lessons_${employee.id}`, JSON.stringify(updated));
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return null;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone,
          bio,
          specializations: specs
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сохранения профиля');
      }

      setProfile(data);
      onProfileUpdate(data);
      setEditMode(false);
      setMessage('Ваш профиль был успешно обновлен!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpec = () => {
    if (specInput.trim() && !specs.includes(specInput.trim())) {
      setSpecs([...specs, specInput.trim()]);
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (indexToRemove: number) => {
    setSpecs(specs.filter((_, idx) => idx !== indexToRemove));
  };

  // Math metrics
  const totalLessonsCount = courses.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);
  const completedLessonsCount = courses.reduce((acc, c) => 
    acc + (c.lessons || []).filter(l => completedLessons.includes(l.id)).length, 0
  );
  const coursesProgressPercent = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;
  const initials = profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div id="employee-dashboard-container" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-slate-900 text-slate-100 py-4 px-6 border-b border-slate-800 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500 rounded-lg text-slate-950">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-base text-white">Support Learning</h1>
              <div className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">Рабочее пространство сотрудника</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-bold text-white leading-tight">{profile.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{profile.profile.department || 'Служба поддержки'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                {initials}
              </div>
            </div>

            <button
              id="employee-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Module Selector / Sub Header */}
      <div className="bg-slate-100 border-b border-slate-250 py-3 px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex gap-3">
          <button
            onClick={() => setActiveModule('learning')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeModule === 'learning'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Академия Обучения</span>
          </button>
          <button
            onClick={() => setActiveModule('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeModule === 'tickets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TicketIcon className="w-4 h-4 text-indigo-500" />
            <span>Ticket Academy (Заявки клиентов)</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      {activeModule === 'learning' ? (
        <main className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Profile & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-500" />
            
            <div className="text-center pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/10 flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-inner">
                {initials}
              </div>
              <h2 className="font-bold text-lg text-slate-900 leading-snug">{profile.name}</h2>
              {profile.profile.positionName && (
                <p className="text-xs font-semibold text-indigo-600 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>{profile.profile.positionName}</span>
                  {profile.profile.rank && (
                    <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded border border-teal-150 text-[9px] font-bold">
                      {profile.profile.rank}
                    </span>
                  )}
                </p>
              )}
              <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider text-[10px] font-bold">{profile.profile.department || 'Инженер поддержки'}</p>
              <p className="text-xs text-teal-650 font-mono mt-2 bg-teal-50/50 px-2.5 py-0.5 rounded-full inline-block border border-teal-100/30">Аккаунт активен</p>
            </div>

            {message && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-lg text-xs mt-4">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-rose-50 text-rose-800 border border-rose-100 p-3 rounded-lg text-xs mt-4">
                {error}
              </div>
            )}

            {/* Profile fields presentation/editing */}
            {!editMode ? (
              <div className="space-y-4 pt-5 text-sm">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Электронная почта</span>
                  <span className="text-slate-800 break-all font-mono text-xs">{profile.email}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Телефон связи</span>
                  <span className="text-slate-800 font-mono">
                    {profile.profile.phone || <em className="text-slate-400">не указан</em>}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">О себе / Навыки</span>
                  <p className="text-slate-600 text-xs italic mt-1 leading-relaxed">
                    {profile.profile.bio || 'Здесь будет ваше краткое описание, которое увидят наставники...'}
                  </p>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Мои специализации</span>
                  {specs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {specs.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium font-mono rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-xs">Специализации не настроены</span>
                  )}
                </div>

                <button
                  id="edit-profile-btn"
                  onClick={() => setEditMode(true)}
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Редактировать профиль
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-5 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ФИО (Доступно только для чтения)</label>
                  <input
                    type="text"
                    value={profile.name}
                    disabled
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Номер телефона</label>
                  <input
                    id="edit-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">О себе (Биография)</label>
                  <textarea
                    id="edit-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Расскажите о своем опыте..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Специализации (Теги)</label>
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={specInput}
                      onChange={(e) => setSpecInput(e.target.value)}
                      placeholder="Напр. CRM"
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="p-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {specs.map((s, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200">
                        {s}
                        <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setSpecs(profile.profile.specializations || []);
                      setBio(profile.profile.bio || '');
                      setPhone(profile.profile.phone || '');
                      setEditMode(false);
                    }}
                    className="flex-1 py-1.5 border hover:bg-slate-50 text-xs font-semibold rounded-lg text-slate-600"
                  >
                    Отмена
                  </button>
                  <button
                    id="save-profile-btn"
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    {saving ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        Сохранить
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Academic Stats Box */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-md p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-teal-400" />
              Прогресс обучения
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Уроков пройдено</span>
                  <span className="font-bold text-white font-mono">{completedLessonsCount} из {totalLessonsCount} ({coursesProgressPercent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${coursesProgressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Рейтинг SLA</div>
                  <div className="text-base font-bold text-teal-400 mt-1 font-mono">98.4%</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Часы лекций</div>
                  <div className="text-base font-bold text-white mt-1 font-mono">1.2 ч</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Ср. балл аттестации</span>
                  <span className="font-bold text-teal-400 font-mono">
                    {(() => {
                      const empGrades = grades.filter(g => g.employeeId === employee.id && g.score > 0);
                      if (empGrades.length === 0) return '—';
                      const avg = empGrades.reduce((sum, g) => sum + g.score, 0) / empGrades.length;
                      return `${avg.toFixed(1)} / 10`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Аттестовано тем: {grades.filter(g => g.employeeId === employee.id).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active training materials & detailed learning portal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Мои курсы обучения</h3>
                <p className="text-xs text-slate-500">Учебные программы, назначенные вам на основании вашей должности и ранга</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                База знаний
              </span>
            </div>

            {/* List of available courses */}
            {coursesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-slate-400">Загрузка учебных программ...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest text-[11px]">Курсы отсутствуют</p>
                <p className="text-xs text-slate-400 mt-2">Для вашей текущей должности и ранга пока нет назначенных учебных курсов.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-4 hover:shadow-xs transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                          {course.positionName} {course.rank ? `• Ранг: ${course.rank}` : ''}
                        </span>
                        <h4 className="font-bold text-base text-slate-950">{course.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {course.description || 'Краткое описание отсутствует.'}
                        </p>
                      </div>

                      {(() => {
                        const startedDates = profile.profile?.courseStartedDates || {};
                        const startedAtStr = startedDates[course.id];
                        const studyDays = course.studyDurationDays || 7;
                        const examDays = course.examDurationDays || 3;

                        if (startedAtStr) {
                          const startDate = new Date(startedAtStr);
                          const studyDeadline = new Date(startDate.getTime() + studyDays * 24 * 60 * 60 * 1000);
                          const examDeadline = new Date(startDate.getTime() + (studyDays + examDays) * 24 * 60 * 60 * 1000);
                          const today = new Date();
                          const diffTime = today.getTime() - startDate.getTime();
                          const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                          const isOverdue = daysElapsed >= (studyDays + examDays);
                          const isLearningOver = daysElapsed >= studyDays;

                          return (
                            <div className="shrink-0 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 md:max-w-[220px] w-full">
                              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">СРОКИ И СТАТУС ОБУЧЕНИЯ</span>
                              <div className="text-xs space-y-0.5 text-slate-600">
                                <div className="flex items-center justify-between gap-1">
                                  <span>Старт:</span>
                                  <strong className="text-slate-800">{startDate.toLocaleDateString('ru-RU')}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <span>Обучение:</span>
                                  <strong className="text-slate-800">{studyDays} дн. (до {studyDeadline.toLocaleDateString('ru-RU')})</strong>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <span>Аттестация:</span>
                                  <strong className="text-indigo-600 font-bold">{examDeadline.toLocaleDateString('ru-RU')}</strong>
                                </div>
                                <div className="pt-1">
                                  {isOverdue ? (
                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-150">Просрочен</span>
                                  ) : isLearningOver ? (
                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-150">На аттестации</span>
                                  ) : (
                                    <span className="inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150">В процессе ({daysElapsed} дн.)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="shrink-0 bg-amber-50/40 border border-amber-150 p-3 rounded-xl space-y-1 md:max-w-[220px] w-full text-center">
                              <span className="block text-[8px] font-bold text-amber-600 uppercase tracking-wider">СРОКИ ОБУЧЕНИЯ</span>
                              <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">Срок: {studyDays} дней</p>
                              <p className="text-[9px] text-slate-500 italic mt-0.5 leading-tight">Нажмите «Изучить» на любом уроке, чтобы начать</p>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <div className="space-y-2 pt-2">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Список уроков в курсе:</h5>
                      <div className="grid grid-cols-1 gap-2.5">
                        {course.lessons.map((lesson, lIdx) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                                isCompleted
                                  ? 'bg-emerald-50/20 border-emerald-100 opacity-85'
                                  : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleLessonCompleted(lesson.id)}
                                  className={`p-0.5 rounded-md mt-0.5 shrink-0 transition-all cursor-pointer ${
                                    isCompleted ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                  title={isCompleted ? 'Отметить как неизученный' : 'Отметить как пройденный'}
                                >
                                  <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'fill-emerald-50' : ''}`} />
                                </button>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-xs font-bold text-slate-450 uppercase tracking-wider">Урок {lIdx + 1}</div>
                                    {(() => {
                                      const grade = grades.find(g => g.courseId === course.id && g.lessonId === lesson.id);
                                      if (grade) {
                                        return (
                                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                            grade.score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                            grade.score >= 5 ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                            'bg-rose-50 text-rose-700 border border-rose-150'
                                          }`}>
                                            Оценка: {grade.score}/10
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  <h6 className={`font-bold text-sm text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                                    {lesson.topic}
                                  </h6>
                                  {lesson.description && (
                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">{lesson.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0 self-end sm:self-center">
                                <div className="flex gap-1.5 mr-1.5">
                                  {lesson.pdfUrl && (
                                    <span className="p-1 bg-red-50 text-red-700 rounded border border-red-100/50" title="Доступен PDF материал">
                                      <FileText className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  {lesson.videoUrl && (
                                    <span className="p-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100/50" title="Доступен видео урок">
                                      <Video className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveCourse(course);
                                    setActiveLesson(lesson);
                                    registerCourseStart(course.id);
                                  }}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                  <span>Изучить</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      ) : (
        <main className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">
          {/* Ticket Academy for Employees */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-950">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400">Модуль поддержки</span>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <TicketIcon className="w-6 h-6 text-indigo-400" />
                Ticket Academy
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Регистрация, обработка и контроль качества закрытия клиентских заявок по каналам Telegram, Email и Teams.
              </p>
            </div>
            <button
              onClick={() => setShowAddTicketForm(!showAddTicketForm)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Зарегистрировать тикет</span>
            </button>
          </div>

          {/* Error / Success Alerts */}
          {ticketError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <span>{ticketError}</span>
            </div>
          )}
          {ticketSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2">
              <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>{ticketSuccessMsg}</span>
            </div>
          )}

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
                  setSelectedTicketId(newTicket.id);
                  setShowAddTicketForm(false);
                }}
                onCancel={() => setShowAddTicketForm(false)}
                supportChannels={supportChannels}
                supportClients={supportClients}
                supportCountries={supportCountries}
                supportStores={supportStores}
                supportKinds={supportKinds}
                employees={activeEmployees}
              />
            </motion.div>
          )}

          {/* Stats Cards */}
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

          {/* Filter Bar */}
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
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={ticketFilterChannel}
                  onChange={(e) => setTicketFilterChannel(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">Все каналы</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                  <option value="teams">Teams</option>
                </select>

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

                <select
                  value={ticketFilterClient}
                  onChange={(e) => setTicketFilterClient(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">Все клиенты</option>
                  {supportClients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

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

          {/* Master Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-sm">
            {/* Left list panel */}
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
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`p-4 transition-all cursor-pointer hover:bg-slate-50 flex flex-col gap-3 ${
                            isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {t.channel === 'telegram' && (
                                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[10px] font-bold">Telegram</span>
                              )}
                              {t.channel === 'email' && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">Email</span>
                              )}
                              {t.channel === 'teams' && (
                                <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold">Teams</span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {t.client} ({t.country})
                              </span>
                              {t.kind && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                                  {t.kind}
                                </span>
                              )}
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

            {/* Right details panel */}
            <div className="lg:col-span-5">
              {selectedTicketId ? (() => {
                const ticket = tickets.find(t => t.id === selectedTicketId);
                if (!ticket) return <div className="p-6 bg-white border rounded-2xl text-center text-xs text-slate-400">Тикет не найден</div>;
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
                        <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          Канал: {ticket.channel.toUpperCase()}
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
                                const emp = activeEmployees.find(e => e.id === selectedId);
                                const name = emp ? emp.name : ticket.assignedToName || '';
                                handleAssignTicket(ticket.id, selectedId, name);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                          >
                            <option value="">— Не назначен —</option>
                            {(() => {
                              const selectOptions = [...activeEmployees];
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
                          <div className="w-full space-y-3 pt-3 border-t border-slate-100">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Комментарий о решении *</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Каким образом решен вопрос..."
                                value={ticketResolutionComment}
                                onChange={(e) => setTicketResolutionComment(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                              <button
                                onClick={() => {
                                  if (!ticketResolutionComment.trim()) {
                                    alert('Пожалуйста, введите комментарий с описанием решения!');
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
                  Выберите тикет из списка слева, чтобы просмотреть подробности или совершить действия.
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Lesson View Overlay Modal */}
      <AnimatePresence>
        {activeLesson && activeCourse && (
          <div id="lesson-modal" className="fixed inset-0 bg-slate-950/65 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-slate-950 text-slate-100 p-5 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-wide">
                      {activeCourse.title}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">{activeLesson.topic}</h3>
                </div>
                <button
                  onClick={() => {
                    setActiveLesson(null);
                    setActiveCourse(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-slate-700">
                {activeLesson.description && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 font-medium text-xs text-slate-600">
                    {activeLesson.description}
                  </div>
                )}

                {/* Lesson Evaluation/Grade if exists */}
                {(() => {
                  const lessonGrade = grades.find(g => g.courseId === activeCourse.id && g.lessonId === activeLesson.id);
                  if (lessonGrade) {
                    return (
                      <div className="p-4 bg-indigo-50/40 border border-indigo-150/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Аттестационная оценка</span>
                          <span className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                            lessonGrade.score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                            lessonGrade.score >= 5 ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            'bg-rose-50 text-rose-700 border border-rose-150'
                          }`}>
                            {lessonGrade.score} из 10 баллов
                          </span>
                          {lessonGrade.comment && (
                            <p className="text-xs text-slate-650 italic mt-1.5 pl-3 border-l-2 border-indigo-200">
                              «{lessonGrade.comment}»
                            </p>
                          )}
                        </div>
                        <div className="text-left shrink-0 sm:border-l sm:border-slate-200/60 sm:pl-4">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Оценил(а)</span>
                          <span className="text-xs font-bold text-slate-800">{lessonGrade.gradedByName || 'Менеджер'}</span>
                          <span className="text-[9px] text-slate-400 block">{new Date(lessonGrade.gradedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Video lesson embed / link */}
                {activeLesson.videoUrl && (() => {
                  const embedUrl = getYoutubeEmbedUrl(activeLesson.videoUrl);
                  if (embedUrl) {
                    return (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-indigo-600" />
                          Видео-урок:
                        </h4>
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black">
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Video lesson"
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-indigo-600" />
                        Видео-урок:
                      </h4>
                      <a
                        href={activeLesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-150 rounded-xl text-xs text-indigo-700 font-bold transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Открыть внешнюю ссылку на видео-урок</span>
                      </a>
                    </div>
                  );
                })()}

                {/* Theoretical content */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Обучающий материал:
                  </h4>
                  <div className="p-5 bg-white border border-slate-200 shadow-inner rounded-2xl leading-relaxed text-slate-800 font-sans whitespace-pre-line text-sm">
                    {activeLesson.content}
                  </div>
                </div>

                {/* PDF Attachment */}
                {activeLesson.pdfUrl && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-rose-600" />
                      Материалы для скачивания (PDF):
                    </h4>
                    <a
                      href={activeLesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-rose-50/30 border border-rose-100/60 hover:bg-rose-50/60 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-rose-600" />
                        <span className="text-xs font-bold text-rose-800">Скачать PDF руководство к уроку</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-150 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400">
                  Курс: <strong className="text-slate-600">{activeCourse.title}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveLesson(null);
                      setActiveCourse(null);
                    }}
                    className="px-4 py-2 border hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={() => {
                      toggleLessonCompleted(activeLesson.id);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      completedLessons.includes(activeLesson.id)
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {completedLessons.includes(activeLesson.id) ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Сбросить прогресс</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Отметить как пройденный</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
