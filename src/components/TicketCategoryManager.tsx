/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, ChevronRight, ChevronDown, FolderTree, Tag, Server, Box, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { CategorySystem, CategoryModule, CategoryType } from '../ticketCategories';

export const TicketCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<CategorySystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expanded nodes state
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Input states for creating items
  const [newSystemName, setNewSystemName] = useState('');
  const [addingModuleForSysId, setAddingModuleForSysId] = useState<string | null>(null);
  const [newModuleName, setNewModuleName] = useState('');

  const [addingTypeForModId, setAddingTypeForModId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');

  const [addingActionForTypeId, setAddingActionForTypeId] = useState<string | null>(null);
  const [newActionName, setNewActionName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ticket-categories');
      if (!res.ok) throw new Error('Не удалось загрузить категории');
      const data = await res.json();
      setCategories(data);
      
      // Auto expand all systems and modules by default
      const initialSys: Record<string, boolean> = {};
      const initialMods: Record<string, boolean> = {};
      data.forEach((sys: any) => {
        const sysKey = sys.id || sys.name;
        initialSys[sysKey] = true;
        (sys.modules || []).forEach((mod: any) => {
          const modKey = mod.id || mod.name;
          initialMods[modKey] = true;
        });
      });
      setExpandedSystems(initialSys);
      setExpandedModules(initialMods);
    } catch (err: any) {
      setError(err.message || 'Ошибка связи с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('support_learning_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // --- Handlers ---
  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemName.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/ticket-categories/systems', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newSystemName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания системы');
      setSuccess(`Система "${newSystemName}" успешно добавлена!`);
      setNewSystemName('');
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSystem = async (sysId: string, name: string) => {
    if (!window.confirm(`Удалить систему "${name}" и все её модули?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/ticket-categories/systems/${sysId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      setSuccess(`Система "${name}" удалена`);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddModule = async (systemId: string) => {
    if (!newModuleName.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/ticket-categories/modules', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ systemId, name: newModuleName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания модуля');
      setSuccess(`Модуль "${newModuleName}" добавлен!`);
      setNewModuleName('');
      setAddingModuleForSysId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteModule = async (modId: string, name: string) => {
    if (!window.confirm(`Удалить модуль "${name}"?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/ticket-categories/modules/${modId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      setSuccess(`Модуль "${name}" удален`);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddType = async (moduleId: string) => {
    if (!newTypeName.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/ticket-categories/types', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ moduleId, name: newTypeName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания типа');
      setSuccess(`Тип "${newTypeName}" добавлен!`);
      setNewTypeName('');
      setAddingTypeForModId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteType = async (typeId: string, name: string) => {
    if (!window.confirm(`Удалить тип "${name}"?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/ticket-categories/types/${typeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      setSuccess(`Тип "${name}" удален`);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddAction = async (typeId: string) => {
    if (!newActionName.trim()) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/ticket-categories/actions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ typeId, name: newActionName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка создания действия');
      setSuccess(`Действие "${newActionName}" добавлено!`);
      setNewActionName('');
      setAddingActionForTypeId(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAction = async (actionId: string, name: string) => {
    if (!window.confirm(`Удалить действие "${name}"?`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/ticket-categories/actions/${actionId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      setSuccess(`Действие "${name}" удалено`);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExpandAll = () => {
    const sysMap: Record<string, boolean> = {};
    const modMap: Record<string, boolean> = {};
    categories.forEach((sys: any) => {
      const sysKey = sys.id || sys.name;
      sysMap[sysKey] = true;
      (sys.modules || []).forEach((mod: any) => {
        const modKey = mod.id || mod.name;
        modMap[modKey] = true;
      });
    });
    setExpandedSystems(sysMap);
    setExpandedModules(modMap);
  };

  const handleCollapseAll = () => {
    const sysMap: Record<string, boolean> = {};
    const modMap: Record<string, boolean> = {};
    categories.forEach((sys: any) => {
      const sysKey = sys.id || sys.name;
      sysMap[sysKey] = false;
      (sys.modules || []).forEach((mod: any) => {
        const modKey = mod.id || mod.name;
        modMap[modKey] = false;
      });
    });
    setExpandedSystems(sysMap);
    setExpandedModules(modMap);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-white border border-[#C9B87A]/35 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFD7] text-[#0F172A] border border-[#C9B87A]/45 text-[10px] font-extrabold uppercase tracking-wider">
              PostgreSQL Base
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#A08C4A]" />
            <span>Матрица классификации обращения (Системы, Модули, Типы)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Управление иерархическим справочником классификации тикетов в Базе Данных PostgreSQL.
          </p>
        </div>

        {/* Actions & Add System Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 bg-[#F5EFD7] hover:bg-[#E1DEDB] border border-[#C9B87A]/45 text-[#0F172A] font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
            >
              📖 Развернуть всё
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-2xs"
            >
              📁 Свернуть всё
            </button>
          </div>

          <form onSubmit={handleAddSystem} className="flex items-center gap-2 bg-[#F7F5F2] p-2 rounded-xl border border-[#C9B87A]/30">
            <input
              type="text"
              placeholder="Новая Система (напр. ERP)"
              value={newSystemName}
              onChange={(e) => setNewSystemName(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C9B87A]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C9B87A]" />
              <span>Добавить</span>
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold text-xs flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#C9B87A] border-t-transparent rounded-full animate-spin" />
          <span>Загрузка матрицы категорий из PostgreSQL...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((sys: any) => {
            const sysKey = sys.id || sys.name;
            const isSysExpanded = expandedSystems[sysKey] ?? true;

            return (
              <div key={sysKey} className="bg-white border border-[#C9B87A]/30 rounded-2xl overflow-hidden shadow-xs">
                {/* System Header */}
                <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedSystems(prev => ({ ...prev, [sysKey]: !isSysExpanded }))}
                      className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    >
                      {isSysExpanded ? <ChevronDown className="w-5 h-5 text-[#C9B87A]" /> : <ChevronRight className="w-5 h-5 text-[#C9B87A]" />}
                    </button>
                    <Server className="w-4.5 h-4.5 text-[#C9B87A]" />
                    <span className="font-extrabold text-sm tracking-wide text-white uppercase">{sys.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F5EFD7] text-[#0F172A] rounded-full">
                      {(sys.modules || []).length} модулей
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddingModuleForSysId(addingModuleForSysId === sys.id ? null : sys.id)}
                      className="px-3 py-1 bg-[#F5EFD7] hover:bg-white text-[#0F172A] rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#A08C4A]" />
                      <span>Модуль</span>
                    </button>
                    {sys.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSystem(sys.id, sys.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Удалить систему"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Form for Adding Module */}
                {addingModuleForSysId === sys.id && (
                  <div className="p-4 bg-[#F5EFD7]/30 border-b border-[#C9B87A]/30 flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0F172A]">Новый модуль для {sys.name}:</span>
                    <input
                      type="text"
                      placeholder="Название модуля (напр. (BO) DOCUMENT)"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      className="px-3 py-1.5 bg-white border rounded-lg text-xs font-semibold flex-1 focus:outline-none focus:ring-2 focus:ring-[#C9B87A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddModule(sys.id)}
                      className="px-4 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-[#1E293B] cursor-pointer"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingModuleForSysId(null)}
                      className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                )}

                {/* Modules Body */}
                {isSysExpanded && (
                  <div className="p-5 space-y-4">
                    {(sys.modules || []).map((mod: any) => {
                      const modKey = mod.id || mod.name;
                      const isModExpanded = expandedModules[modKey] ?? true;

                      return (
                        <div key={modKey} className="bg-[#F7F5F2]/60 border border-[#C9B87A]/25 rounded-xl p-4 space-y-3">
                          {/* Module Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-[#C9B87A]/20">
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setExpandedModules(prev => ({ ...prev, [modKey]: !isModExpanded }))}
                                className="p-0.5 text-slate-400 hover:text-slate-700"
                              >
                                {isModExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <Box className="w-4 h-4 text-[#A08C4A]" />
                              <span className="font-bold text-xs text-[#0F172A]">{mod.name}</span>
                              <span className="text-[9px] font-semibold text-slate-500">
                                ({(mod.types || []).length} типов)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setAddingTypeForModId(addingTypeForModId === mod.id ? null : mod.id)}
                                className="px-2.5 py-1 bg-white hover:bg-[#F5EFD7] border border-[#C9B87A]/40 text-[#0F172A] rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-[#A08C4A]" />
                                <span>Тип</span>
                              </button>
                              {mod.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteModule(mod.id, mod.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Form for Adding Type */}
                          {addingTypeForModId === mod.id && (
                            <div className="p-3 bg-white border border-[#C9B87A]/40 rounded-lg flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Новый тип (напр. (BO) EDITING)"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                className="px-3 py-1 bg-slate-50 border rounded text-xs font-medium flex-1 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddType(mod.id)}
                                className="px-3 py-1 bg-[#0F172A] text-white text-xs font-bold rounded cursor-pointer"
                              >
                                Добавить тип
                              </button>
                            </div>
                          )}

                          {/* Types list */}
                          {isModExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                              {(mod.types || []).map((typ: any) => (
                                <div key={typ.id || typ.name} className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                      <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>{typ.name}</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setAddingActionForTypeId(addingActionForTypeId === typ.id ? null : typ.id)}
                                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold flex items-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Действие</span>
                                      </button>
                                      {typ.id && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteType(typ.id, typ.name)}
                                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions Tags */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {(typ.actions || []).map((act: string, aIdx: number) => (
                                      <span key={aIdx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-medium flex items-center gap-1">
                                        <span>{act}</span>
                                      </span>
                                    ))}
                                    {(!typ.actions || typ.actions.length === 0) && (
                                      <span className="text-[10px] text-slate-400 italic">Без выпадающих действий</span>
                                    )}
                                  </div>

                                  {/* Inline Form for Adding Action */}
                                  {addingActionForTypeId === typ.id && (
                                    <div className="mt-2 pt-2 border-t flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Название действия"
                                        value={newActionName}
                                        onChange={(e) => setNewActionName(e.target.value)}
                                        className="px-2 py-1 bg-slate-50 border rounded text-[11px] flex-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddAction(typ.id)}
                                        className="px-2 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded"
                                      >
                                        OK
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {(mod.types || []).length === 0 && (
                                <span className="text-xs text-slate-400 italic col-span-2">В данном модуле пока нет типов</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(sys.modules || []).length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl">
                        В этой системе пока нет модулей. Нажмите кнопку "+ Модуль" выше, чтобы добавить первый модуль.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
