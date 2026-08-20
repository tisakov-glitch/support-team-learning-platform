import React, { useState } from 'react';
import { Ticket as TicketIcon, X, AlertCircle, Check, Paperclip, Trash2 } from 'lucide-react';
import { VoiceTicketRecorder } from './VoiceTicketRecorder';
import { ImageTicketAnalyzer } from './ImageTicketAnalyzer';
import { TICKET_CATEGORIES } from '../ticketCategories';
import { Ticket, TicketChannel, TicketCreatorType, SupportChannel, SupportClient, SupportCountry, SupportStore, SupportKind, Employee } from '../types';

interface TicketRegistrationFormProps {
  onSuccess: (newTicket: Ticket) => void;
  onCancel?: () => void;
  supportChannels: SupportChannel[];
  supportClients: SupportClient[];
  supportCountries: SupportCountry[];
  supportStores: SupportStore[];
  supportKinds: SupportKind[];
  employees?: Employee[];
}

function getCurrentDatetimeLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const TicketRegistrationForm: React.FC<TicketRegistrationFormProps> = ({
  onSuccess,
  onCancel,
  supportChannels = [],
  supportClients = [],
  supportCountries = [],
  supportStores = [],
  supportKinds = [],
  employees = []
}) => {
  const [channel, setChannel] = useState<TicketChannel>('telegram');
  const [client, setClient] = useState('');
  const [country, setCountry] = useState('');
  const [creatorType, setCreatorType] = useState<TicketCreatorType>('store');
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState('');
  const [system, setSystem] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [typeName, setTypeName] = useState('');
  const [actionName, setActionName] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string; url: string }[]>([]);
  const [createdAt, setCreatedAt] = useState(getCurrentDatetimeLocal());
  const [startedWorkingAt, setStartedWorkingAt] = useState('');
  const [closedAt, setClosedAt] = useState('');
  const [confirmedAt, setConfirmedAt] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [confirmationAttachment, setConfirmationAttachment] = useState<{ name: string; size: number; type: string; url: string } | null>(null);
  const [assignedToId, setAssignedToId] = useState('');
  const [assignedToName, setAssignedToName] = useState('');

  const [categories, setCategories] = useState(TICKET_CATEGORIES);

  useEffect(() => {
    fetch('/api/ticket-categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileAttachment = (files: File[]) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            url: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiRecognized = (data: any, isAppendMode?: boolean) => {
    if (isAppendMode) {
      if (data.requesterName) {
        setRequesterName(prev => (!prev ? data.requesterName : prev.includes(data.requesterName) ? prev : `${prev}, ${data.requesterName}`));
      }
      if (data.subject) {
        setSubject(prev => (!prev ? data.subject : prev.includes(data.subject) ? prev : `${prev} | ${data.subject}`));
      }
      if (data.description) {
        setDescription(prev => (!prev ? data.description : `${prev}\n${data.description}`));
      }
    } else {
      if (data.requesterName) setRequesterName(data.requesterName);
      if (data.subject) setSubject(data.subject);
      if (data.description) setDescription(data.description);
    }

    if (data.datetime) {
      const cleanDt = data.datetime.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) setCreatedAt(cleanDt);
    }
    if (data.startedWorkingAt) {
      const cleanDt = data.startedWorkingAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) setStartedWorkingAt(cleanDt);
    }
    if (data.closedAt) {
      const cleanDt = data.closedAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) setClosedAt(cleanDt);
    }
    if (data.confirmedAt) {
      const cleanDt = data.confirmedAt.slice(0, 16);
      if (cleanDt && !isNaN(Date.parse(cleanDt))) setConfirmedAt(cleanDt);
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
        setChannel(matchedChannel.code as any);
      }
    }

    if (data.storeId) {
      if (data.storeId === 'all') {
        setStoreId('all');
        setStoreName('Все магазины');
        setCreatorType('store');
      } else {
        const matchedStore = (supportStores || []).find(s => 
          s.id === data.storeId || 
          (s.code && s.code.toLowerCase() === data.storeId.toLowerCase()) ||
          s.name.toLowerCase().includes(data.storeId.toLowerCase()) ||
          data.storeId.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedStore) {
          setStoreId(matchedStore.id);
          setStoreName(`${matchedStore.name} (${matchedStore.code || ''})`);
          setCreatorType('store');

          // Auto infer Client
          const storeClient = (supportClients || []).find(c => c.id === matchedStore.clientId);
          if (storeClient) {
            setClient(storeClient.name);
          }

          // Auto infer Country
          if (matchedStore.countryId) {
            const storeCountryObj = (supportCountries || []).find(c => c.id === matchedStore.countryId);
            if (storeCountryObj) {
              setCountry(storeCountryObj.name);
            }
          } else if (matchedStore.country) {
            setCountry(matchedStore.country);
          }
        }
      }
    }

    if (data.client) {
      const matchedClient = (supportClients || []).find(c => 
        c.name.toLowerCase() === data.client.toLowerCase() ||
        c.name.toLowerCase().includes(data.client.toLowerCase()) ||
        data.client.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedClient) {
        setClient(matchedClient.name);
        if (matchedClient.countries && matchedClient.countries.length > 0) {
          setCountry(prev => prev || matchedClient.countries[0]);
        }
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
        setCountry(matchedCountry.name);
      } else {
        setCountry(data.country);
      }
    }

    if (data.system) {
      const matchedSys = categories.find(sys => sys.name.toLowerCase() === data.system.toLowerCase());
      if (matchedSys) {
        setSystem(matchedSys.name);
        if (data.module) {
          const matchedMod = matchedSys.modules.find(mod => mod.name.toLowerCase() === data.module.toLowerCase() || mod.name.toLowerCase().includes(data.module.toLowerCase()));
          if (matchedMod) {
            setModuleName(matchedMod.name);
            if (data.type) {
              const matchedT = matchedMod.types.find(t => t.name.toLowerCase() === data.type.toLowerCase() || t.name.toLowerCase().includes(data.type.toLowerCase()));
              if (matchedT) {
                setTypeName(matchedT.name);
                if (data.action && matchedT.actions?.includes(data.action)) {
                  setActionName(data.action);
                }
              }
            }
          }
        }
      }
    }

    if (data.kind) {
      const matchedKind = (supportKinds || []).find(k => k.name.toLowerCase() === data.kind.toLowerCase() || k.name.toLowerCase().includes(data.kind.toLowerCase()));
      if (matchedKind) {
        setKind(matchedKind.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      setError('Пожалуйста, выберите клиента!');
      return;
    }
    if (creatorType === 'store' && !storeId) {
      setError('Пожалуйста, выберите магазин!');
      return;
    }
    if (!subject.trim()) {
      setError('Пожалуйста, укажите тему обращения!');
      return;
    }
    if (!system || !moduleName || !typeName) {
      setError('Пожалуйста, укажите классификацию обращения (Система, Модуль, Тип)!');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('support_learning_token');
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channel,
          client,
          country,
          creatorType,
          storeId: creatorType === 'store' ? (storeId || undefined) : undefined,
          storeName: creatorType === 'store' ? (storeName || undefined) : undefined,
          requesterName,
          subject,
          description,
          kind,
          system,
          module: moduleName,
          type: typeName,
          action: actionName,
          attachments,
          createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
          startedWorkingAt: startedWorkingAt ? new Date(startedWorkingAt).toISOString() : undefined,
          closedAt: closedAt ? new Date(closedAt).toISOString() : undefined,
          confirmedAt: confirmedAt ? new Date(confirmedAt).toISOString() : undefined,
          resolutionComment: resolutionComment || undefined,
          confirmationAttachment: confirmationAttachment || undefined,
          assignedToId: assignedToId || undefined,
          assignedToName: assignedToName || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Не удалось зарегистрировать тикет');
      }

      setSuccessMsg('Обращение успешно зарегистрировано!');
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeClientObj = supportClients.find(c => c.name === client);
  const availableCountries = activeClientObj && activeClientObj.countries && activeClientObj.countries.length > 0
    ? activeClientObj.countries
    : (supportCountries || []).map(cnt => cnt.name);

  const selectedSys = categories.find(s => s.name === system);
  const selectedMod = selectedSys?.modules.find(m => m.name === moduleName);
  const selectedType = selectedMod?.types.find(t => t.name === typeName);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <TicketIcon className="w-4 h-4 text-indigo-500" />
          <span>Регистрация нового обращения в поддержку</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <VoiceTicketRecorder onRecognized={handleAiRecognized} />
          <ImageTicketAnalyzer onRecognized={handleAiRecognized} />
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Channel Select */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Канал связи *</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as TicketChannel)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            {supportChannels.map(ch => (
              <option key={ch.id} value={ch.code}>{ch.name}</option>
            ))}
          </select>
        </div>

        {/* Client Select */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Клиент *</label>
          <select
            value={client}
            onChange={(e) => {
              const val = e.target.value;
              setClient(val);
              const clientObj = supportClients.find(c => c.name === val);
              if (clientObj && clientObj.countries && clientObj.countries.length > 0) {
                setCountry(clientObj.countries[0]);
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="">-- Выберите клиента --</option>
            {supportClients.map(cl => (
              <option key={cl.id} value={cl.name}>{cl.name}</option>
            ))}
          </select>
        </div>

        {/* Country Select */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Страна присутствия *</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="">-- Выберите страну --</option>
            {availableCountries.map(cnt => (
              <option key={cnt} value={cnt}>{cnt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Creator Type */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Тип заявителя *</label>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setCreatorType('store');
                setStoreId('');
                setStoreName('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creatorType === 'store'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Магазин
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatorType('office');
                setStoreId('');
                setStoreName('');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                creatorType === 'office'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Офис
            </button>
          </div>
        </div>

        {/* Requester Name */}
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ФИО заявителя</label>
          <input
            type="text"
            placeholder="Например: Ljiljana Cvetkovic (необязательно)"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Store Select */}
      {creatorType === 'store' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Выбор магазина *</label>
          <select
            value={storeId}
            onChange={(e) => {
              const val = e.target.value;
              setStoreId(val);
              if (val === 'all') {
                setStoreName('Все магазины');
              } else {
                const sObj = supportStores.find(s => s.id === val);
                if (sObj) {
                  setStoreName(`${sObj.name} (${sObj.code || ''})`);
                  const sClient = supportClients.find(c => c.id === sObj.clientId);
                  if (sClient) setClient(sClient.name);
                  if (sObj.countryId) {
                    const sCountry = supportCountries.find(c => c.id === sObj.countryId);
                    if (sCountry) setCountry(sCountry.name);
                  } else if (sObj.country) {
                    setCountry(sObj.country);
                  }
                }
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="">-- Выберите магазин --</option>
            <option value="all">Все магазины</option>
            {supportStores
              .filter(s => !client || (supportClients.find(c => c.name === client)?.id === s.clientId))
              .map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code || 'Без кода'})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Subject & Description */}
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Тема обращения *</label>
          <input
            type="text"
            placeholder="Краткая суть обращения..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Подробное описание</label>
          <textarea
            rows={3}
            placeholder="Подробное описание проблемы..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 resize-none"
          />
        </div>
      </div>

      {/* Kind & Classification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Вид тикета</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="">-- Выберите вид тикета --</option>
            {supportKinds.map(k => (
              <option key={k.id} value={k.name}>{k.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Система *</label>
          <select
            value={system}
            onChange={(e) => {
              setSystem(e.target.value);
              setModuleName('');
              setTypeName('');
              setActionName('');
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
          >
            <option value="">-- Выберите систему --</option>
            {categories.map(sys => (
              <option key={sys.id} value={sys.name}>{sys.name}</option>
            ))}
          </select>
        </div>
      </div>

      {system && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Модуль *</label>
            <select
              value={moduleName}
              onChange={(e) => {
                setModuleName(e.target.value);
                setTypeName('');
                setActionName('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="">-- Выберите модуль --</option>
              {selectedSys?.modules.map(mod => (
                <option key={mod.id} value={mod.name}>{mod.name}</option>
              ))}
            </select>
          </div>

          {moduleName && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Тип обращения *</label>
              <select
                value={typeName}
                onChange={(e) => {
                  setTypeName(e.target.value);
                  setActionName('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              >
                <option value="">-- Выберите тип --</option>
                {selectedMod?.types.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {typeName && selectedType?.actions && selectedType.actions.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Действие</label>
              <select
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
              >
                <option value="">-- Выберите действие --</option>
                {selectedType.actions.map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Optional lifecycle fields */}
      <div className="bg-indigo-50/20 border border-indigo-100/40 rounded-2xl p-4 text-xs space-y-3.5">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
          Дополнительные реквизиты жизненного цикла (Опционально)
        </span>

        {employees && employees.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Назначить исполнителя</label>
            <select
              value={assignedToId}
              onChange={(e) => {
                const selectedId = e.target.value;
                setAssignedToId(selectedId);
                const emp = employees.find(emp => emp.id === selectedId);
                setAssignedToName(emp ? emp.name : '');
              }}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="">— Не назначен —</option>
              {employees.filter(emp => emp.status === 'active').map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.profile?.positionName || (emp.role === 'admin' ? 'Администратор' : 'Специалист')})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Время и дата заявки</label>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Время начала работы</label>
            <input
              type="datetime-local"
              value={startedWorkingAt}
              onChange={(e) => setStartedWorkingAt(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">3. Время и дата закрытия</label>
            <input
              type="datetime-local"
              value={closedAt}
              onChange={(e) => setClosedAt(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">4. Подтверждение клиента</label>
            <input
              type="datetime-local"
              value={confirmedAt}
              onChange={(e) => setConfirmedAt(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Комментарий решения</label>
          <textarea
            rows={2}
            placeholder="Комментарий решения при закрытии тикета..."
            value={resolutionComment}
            onChange={(e) => setResolutionComment(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
          />
        </div>

        <div className="border-t border-slate-200/50 pt-2.5 space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Прикрепить скриншот подтверждения от клиента</label>
          <div className="flex items-center gap-2">
            <input
              id="ticket-form-confirmation-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      setConfirmationAttachment({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: ev.target.result as string
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="text-xs text-slate-500"
            />
          </div>
          {confirmationAttachment && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-white border rounded-xl">
              <div className="w-10 h-10 rounded-lg overflow-hidden border bg-slate-50">
                <img src={confirmationAttachment.url} alt="Превью" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] text-slate-600 truncate font-bold">{confirmationAttachment.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationAttachment(null)}
                className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Прикрепленные файлы</label>
        <div className="flex items-center gap-3">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
            <Paperclip className="w-4 h-4" />
            <span>Прикрепить файл</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFileAttachment(Array.from(e.target.files));
              }}
            />
          </label>
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <span>{att.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 border border-[#C9B87A]/40"
        >
          {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          <span>Зарегистрировать тикет</span>
        </button>
      </div>
    </form>
  );
};
