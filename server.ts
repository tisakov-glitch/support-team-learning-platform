/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Employee, SimulatedEmail, Invitation, DepartmentDefinition, RoleDefinition, PositionDefinition, Course, Lesson, LessonGrade, Ticket, SupportChannel, SupportClient, SupportStore, SupportKind, SupportCountry } from './src/types';

import { initialCourses } from './src/initialCourses';
import { GoogleGenAI, Type } from '@google/genai';
import { TICKET_CATEGORIES } from './src/ticketCategories';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const appFilename = typeof __filename !== 'undefined' ? __filename : process.cwd();
const appDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(appFilename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');

// Interface for DB structure
interface LocalDatabase {
  employees: Record<string, Employee & { password?: string }>;
  emails: SimulatedEmail[];
  invitations: Record<string, Invitation>;
  departments: DepartmentDefinition[];
  roles: RoleDefinition[];
  positions: PositionDefinition[];
  courses: Course[];
  grades: LessonGrade[];
  tickets: Ticket[];
  supportChannels: SupportChannel[];
  supportClients: SupportClient[];
  supportStores: SupportStore[];
  supportKinds: SupportKind[];
  supportCountries: SupportCountry[];
}

// Default initial database content
const defaultDB: LocalDatabase = {
  employees: {
    'admin-1': {
      id: 'admin-1',
      email: 'admin@support.edu',
      name: 'Александр Иванов',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      password: 'admin123',
      profile: {
        phone: '+7 (999) 000-00-00',
        department: 'RetMind',
        specializations: ['Управление платформой', 'Настройки'],
        bio: 'Главный администратор платформы обучения.',
        avatarStyle: 'alex',
        positionCode: '00',
        positionName: 'CEO'
      }
    },
    'emp-dastan': {
      id: 'emp-dastan',
      email: 'Dastan.Abitkulov@retmind.com',
      name: 'Dastan Abitkulov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996554900155',
        department: 'RetMind Support',
        specializations: ['Помощь клиентам'],
        bio: 'Специалист поддержки L1',
        avatarStyle: 'dastan-abitkulov',
        positionCode: '13',
        positionName: 'Support Specialist',
        rank: 'Specialist L1 (Junior)'
      }
    },
    'emp-atai-c': {
      id: 'emp-atai-c',
      email: 'Atai.Chekrikbaev@retmind.com',
      name: 'Atai Chekrikbaev',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996707153465',
        department: 'RetMind Support',
        specializations: ['Вводное обучение'],
        bio: 'Стажер службы поддержки',
        avatarStyle: 'atai-chekrikbaev',
        positionCode: '14',
        positionName: 'Support Intern',
        rank: 'Intern / Trainee'
      }
    },
    'emp-atai-d': {
      id: 'emp-atai-d',
      email: 'Atai.Davletaliev@retmind.com',
      name: 'Atai Davletaliev',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996709990292',
        department: 'RetMind Support',
        specializations: ['Управление сменой'],
        bio: 'Руководитель смены L1',
        avatarStyle: 'atai-davletaliev',
        positionCode: '12',
        positionName: 'Support Shift Manager',
        rank: 'Shift Manager L1'
      }
    },
    'emp-altynbek': {
      id: 'emp-altynbek',
      email: 'Altynbek.Dzhumakeev@retmind.com',
      name: 'Altynbek Dzhumakeev',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996551824582',
        department: 'RetMind Support',
        specializations: ['Управление сменой'],
        bio: 'Руководитель смены L1',
        avatarStyle: 'altynbek-dzhumakeev',
        positionCode: '12',
        positionName: 'Support Shift Manager',
        rank: 'Shift Manager L1'
      }
    },
    'emp-ramazan': {
      id: 'emp-ramazan',
      email: 'Ramazan.Kurbanov@retmind.com',
      name: 'Ramazan Kurbanov',
      role: 'manager',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996703464913',
        department: 'RetMind Support',
        specializations: ['Руководство командой', 'Управление качеством'],
        bio: 'Руководитель службы поддержки',
        avatarStyle: 'ramazan-kurbanov',
        positionCode: '11',
        positionName: 'Team Lead of the Support',
        rank: ''
      }
    },
    'emp-said': {
      id: 'emp-said',
      email: 'Said.Mansurkhanov@retmind.com',
      name: 'Said Mansurkhanov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996770327141',
        department: 'RetMind Support',
        specializations: ['Вводное обучение'],
        bio: 'Стажер службы поддержки',
        avatarStyle: 'said-mansurkhanov',
        positionCode: '14',
        positionName: 'Support Intern',
        rank: 'Intern / Trainee'
      }
    },
    'emp-albina': {
      id: 'emp-albina',
      email: 'Albina.Mayrambekova@retmind.com',
      name: 'Albina Mayrambekova',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996707860005',
        department: 'RetMind Support',
        specializations: ['Помощь клиентам'],
        bio: 'Специалист поддержки L1',
        avatarStyle: 'albina-mayrambekova',
        positionCode: '13',
        positionName: 'Support Specialist',
        rank: 'Specialist L1 (Junior)'
      }
    },
    'emp-ulukbek': {
      id: 'emp-ulukbek',
      email: 'Ulukbek.Raatbekov@retmind.com',
      name: 'Ulukbek Raatbekov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+261346350064',
        department: 'RetMind Support',
        specializations: ['Управление сменой'],
        bio: 'Руководитель смены L1',
        avatarStyle: 'ulukbek-raatbekov',
        positionCode: '12',
        positionName: 'Support Shift Manager',
        rank: 'Shift Manager L1'
      }
    },
    'emp-madina': {
      id: 'emp-madina',
      email: 'Madina.Raimbekova@retmind.com',
      name: 'Madina Raimbekova',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996501455001',
        department: 'RetMind Support',
        specializations: ['Сложные кейсы'],
        bio: 'Специалист поддержки L2',
        avatarStyle: 'madina-raimbekova',
        positionCode: '13',
        positionName: 'Support Specialist',
        rank: 'Specialist L2 (Middle)'
      }
    },
    'emp-malika': {
      id: 'emp-malika',
      email: 'Malika.Raiymbekova@retmind.com',
      name: 'Malika Raiymbekova',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996222002733',
        department: 'RetMind Support',
        specializations: ['Вводное обучение'],
        bio: 'Стажер службы поддержки',
        avatarStyle: 'malika-raiymbekova',
        positionCode: '14',
        positionName: 'Support Intern',
        rank: 'Intern / Trainee'
      }
    },
    'emp-abdulaziz': {
      id: 'emp-abdulaziz',
      email: 'Abdulaziz.Ravshanbekov@retmind.com',
      name: 'Abdulaziz Ravshanbekov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996551551959',
        department: 'RetMind Support',
        specializations: ['Помощь клиентам'],
        bio: 'Специалист поддержки L1',
        avatarStyle: 'abdulaziz-ravshanbekov',
        positionCode: '13',
        positionName: 'Support Specialist',
        rank: 'Specialist L1 (Junior)'
      }
    },
    'emp-nursultan': {
      id: 'emp-nursultan',
      email: 'Nursultan.Saparzholov@retmind.com',
      name: 'Nursultan Saparzholov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996700067459',
        department: 'RetMind Support',
        specializations: ['Управление сменой'],
        bio: 'Руководитель смены L1',
        avatarStyle: 'nursultan-saparzholov',
        positionCode: '12',
        positionName: 'Support Shift Manager',
        rank: 'Shift Manager L1'
      }
    },
    'emp-syimyk': {
      id: 'emp-syimyk',
      email: 'Syimyk.Toktorbekov@retmind.com',
      name: 'Syimyk Toktorbekov',
      role: 'employee',
      status: 'active',
      createdAt: '2026-07-09T13:40:00.000Z',
      password: 'password123',
      profile: {
        phone: '+996508051107',
        department: 'RetMind Support',
        specializations: ['Вводное обучение'],
        bio: 'Стажер службы поддержки',
        avatarStyle: 'syimyk-toktorbekov',
        positionCode: '14',
        positionName: 'Support Intern',
        rank: 'Intern / Trainee'
      }
    }
  },
  emails: [],
  invitations: {},
  departments: [
    { id: 'dept-0', name: 'RetMind' },
    { id: 'dept-1', name: 'RetMind Large / Trade' },
    { id: 'dept-2', name: 'RetMind Large / FinCor' },
    { id: 'dept-3', name: 'RetMind DevOps' },
    { id: 'dept-4', name: 'RetMind PRO' },
    { id: 'dept-5', name: 'RetMind Support' }
  ],
  roles: [
    { code: 'admin', name: 'Администратор', systemRole: 'admin' },
    { code: 'manager', name: 'Менеджер', systemRole: 'manager' },
    { code: 'employee', name: 'Сотрудник', systemRole: 'employee' }
  ],
  positions: [
    { code: '00', name: 'CEO', departmentId: 'dept-0', roleCode: 'manager' },
    { code: '01', name: 'Large Trade Line Manager', departmentId: 'dept-1', roleCode: 'manager' },
    { code: '02', name: 'Large FinCore Line Manager', departmentId: 'dept-2', roleCode: 'manager' },
    { code: '03', name: 'Operational director', departmentId: 'dept-0', roleCode: 'manager' },
    { code: '04', name: 'Project Manager', departmentId: 'dept-0', roleCode: 'manager' },
    { code: '05', name: 'Operational Manager', departmentId: 'dept-0', roleCode: 'employee' },
    { code: '06', name: 'Team Lead of Developers', departmentId: 'dept-0', roleCode: 'manager' },
    { code: '07', name: 'Team Lead of DevOps', departmentId: 'dept-3', roleCode: 'manager' },
    { code: '08', name: 'DevOps', departmentId: 'dept-3', roleCode: 'employee' },
    { code: '09', name: 'Developer PRO', departmentId: 'dept-4', roleCode: 'employee' },
    { code: '10', name: 'Developer Large', departmentId: 'dept-1', roleCode: 'employee' },
    { code: '11', name: 'Team Lead of the Support', departmentId: 'dept-5', roleCode: 'manager' },
    { code: '12', name: 'Support Shift Manager', departmentId: 'dept-5', roleCode: 'employee', ranks: ['Shift Manager L1', 'Shift Manager L2'] },
    { code: '13', name: 'Support Specialist', departmentId: 'dept-5', roleCode: 'employee', ranks: ['Specialist L1 (Junior)', 'Specialist L2 (Middle)', 'Specialist L3 (Senior)'] },
    { code: '14', name: 'Support Intern', departmentId: 'dept-5', roleCode: 'employee', ranks: ['Candidate', 'Intern / Trainee'] },
    { code: '15', name: 'HR Manager', departmentId: 'dept-0', roleCode: 'employee' }
  ],
  courses: initialCourses,
  grades: [],
  tickets: [
    {
      id: 'ticket-1',
      channel: 'telegram',
      client: 'Koton',
      country: 'Россия',
      creatorType: 'store',
      requesterName: 'Анна (Магазин Koton Авиапарк)',
      subject: 'Не работает кассовый аппарат',
      description: 'При проведении оплаты картой выходит ошибка связи с банком. Перезагрузка терминала не помогла.',
      status: 'open',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      system: 'FO',
      module: '(FO) SALE',
      type: '(FO) BANK TERMINAL',
      action: '(FO) INTAGRATION'
    },
    {
      id: 'ticket-2',
      channel: 'email',
      client: 'LCW',
      country: 'Россия',
      creatorType: 'office',
      requesterName: 'Бахытжан (Офис LCW Москва)',
      subject: 'Доступ к аналитическому отчету',
      description: 'Прошу предоставить доступ к модулю продаж за прошлый месяц для нового сотрудника отдела планирования.',
      status: 'resolved',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      assignedToId: 'emp-dastan',
      assignedToName: 'Dastan Abitkulov',
      resolutionComment: 'Доступ предоставлен, отправлена инструкция по подключению.',
      system: 'BO',
      module: '(BO) EMPLOYEE',
      type: '(BO) ACCESS',
      action: ''
    },
    {
      id: 'ticket-3',
      channel: 'teams',
      client: 'Mittivoy',
      country: 'Узбекистан',
      creatorType: 'store',
      requesterName: 'Сардор (Магазин Самарканд Дарвоза)',
      subject: 'Сбой синхронизации стоков',
      description: 'Остатки товара в системе не сходятся с фактическим наличием на складе. Нужна принудительная перевыгрузка.',
      status: 'closed',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
      assignedToId: 'emp-atai-d',
      assignedToName: 'Atai Davletaliev',
      resolutionComment: 'Запущена ручная синхронизация остатков, стоки сошлись в соответствии с фактическим количеством.',
      closedById: 'admin-1',
      closedByName: 'Александр Иванов',
      system: 'LCW-TEAMS',
      module: '(LCW-TEAMS) SALE',
      type: '(LCW-TEAMS) GOODS UPLOAD',
      action: ''
    }
  ],
  supportChannels: [
    { id: 'channel-1', code: 'telegram', name: 'Telegram каналы' },
    { id: 'channel-2', code: 'email', name: 'Электронная почта' },
    { id: 'channel-3', code: 'teams', name: 'Microsoft Teams' }
  ],
  supportClients: [
    { id: 'client-1', name: 'Koton', countries: ['Россия', 'Бифонко', 'Казахстан', 'Грузия', 'Беларусь', 'Украина', 'Румыния', 'Марокко', 'Сербия', 'Македония', 'Босния', 'Венгрия', 'Индия', 'Америка'] },
    { id: 'client-2', name: 'OZZE', countries: ['Казахстан'] },
    { id: 'client-3', name: 'LCW', countries: ['Россия', 'Белоруссия'] },
    { id: 'client-4', name: 'Civil', countries: ['Казахстан'] },
    { id: 'client-5', name: 'Mittivoy', countries: ['Узбекистан'] },
    { id: 'client-6', name: 'Indenim', countries: ['Узбекистан'] },
    { id: 'client-7', name: 'DayMart', countries: ['Узбекистан'] },
    { id: 'client-8', name: 'Aynimo', countries: ['Узбекистан'] },
    { id: 'client-9', name: 'Aynimo-Kids', countries: ['Узбекистан'] }
  ],
  supportStores: [
    { id: 'store-1', name: 'Koton Авиапарк', clientId: 'client-1', country: 'Россия' },
    { id: 'store-2', name: 'Koton Минск', clientId: 'client-1', country: 'Беларусь' },
    { id: 'store-3', name: 'OZZE Алматы', clientId: 'client-2', country: 'Казахстан' },
    { id: 'store-4', name: 'LCW Москва', clientId: 'client-3', country: 'Россия' },
    { id: 'store-5', name: 'Civil Астана', clientId: 'client-4', country: 'Казахстан' },
    { id: 'store-6', name: 'Mittivoy Самарканд Дарвоза', clientId: 'client-5', country: 'Узбекистан' },
    { id: 'store-7', name: 'Indenim Ташкент', clientId: 'client-6', country: 'Узбекистан' },
    { id: 'store-8', name: 'DayMart Наманган', clientId: 'client-7', country: 'Узбекистан' },
    { id: 'store-9', name: 'Aynimo Коканд', clientId: 'client-8', country: 'Узбекистан' },
    { id: 'store-10', name: 'Aynimo-Kids Андижан', clientId: 'client-9', country: 'Узбекистан' }
  ],
  supportKinds: [
    { id: 'kind-1', name: 'Информационная задача' },
    { id: 'kind-2', name: 'Операционная задача' },
    { id: 'kind-3', name: 'Рутинная задача' },
    { id: 'kind-4', name: 'Ошибка системы' },
    { id: 'kind-5', name: 'Ошибка оператора' }
  ],
  supportCountries: [
    { id: 'country-kz', code: 'KZ', name: 'Казахстан', status: 'active' },
    { id: 'country-ru', code: 'RU', name: 'Россия', status: 'active' },
    { id: 'country-uz', code: 'UZ', name: 'Узбекистан', status: 'active' },
    { id: 'country-by', code: 'BY', name: 'Беларусь', status: 'active' },
    { id: 'country-ge', code: 'GE', name: 'Грузия', status: 'active' },
    { id: 'country-tr', code: 'TR', name: 'Турция', status: 'active' },
    { id: 'country-ma', code: 'MA', name: 'Марокко', status: 'active' },
    { id: 'country-rs', code: 'RS', name: 'Сербия', status: 'active' },
    { id: 'country-mk', code: 'MK', name: 'Северная Македония', status: 'active' },
    { id: 'country-ba', code: 'BA', name: 'Босния и Герцеговина', status: 'active' },
    { id: 'country-hu', code: 'HU', name: 'Венгрия', status: 'active' },
    { id: 'country-in', code: 'IN', name: 'Индия', status: 'active' },
    { id: 'country-us', code: 'US', name: 'Америка', status: 'active' },
    { id: 'country-ro', code: 'RO', name: 'Румыния', status: 'active' }
  ]
};

// Database utility helpers
function readDB(): LocalDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      let updated = false;

      if (!parsed.supportCountries || parsed.supportCountries.length === 0) {
        parsed.supportCountries = defaultDB.supportCountries;
        updated = true;
      }

      // Migrate roles, departments, positions if not existing
      if (!parsed.departments) {
        parsed.departments = defaultDB.departments;
        updated = true;
      }
      if (!parsed.roles) {
        parsed.roles = defaultDB.roles;
        updated = true;
      } else if (!parsed.roles.some((r: any) => r.code === 'manager')) {
        parsed.roles.push({ code: 'manager', name: 'Менеджер', systemRole: 'manager' });
        updated = true;
      }
      if (!parsed.positions) {
        parsed.positions = defaultDB.positions;
        updated = true;
      } else {
        // Ensure default positions have their ranks restored if empty
        for (const defPos of defaultDB.positions) {
          const p = parsed.positions.find((pos: any) => pos.code === defPos.code);
          if (p && defPos.ranks && (!p.ranks || p.ranks.length === 0)) {
            p.ranks = defPos.ranks;
            updated = true;
          }
        }
      }
      // Ensure all default/system courses are synchronized and up-to-date
      if (!parsed.courses) {
        parsed.courses = [];
      }
      for (const defaultCourse of defaultDB.courses) {
        const existingIdx = parsed.courses.findIndex((c: any) => c.id === defaultCourse.id);
        if (existingIdx === -1) {
          parsed.courses.push(defaultCourse);
          updated = true;
        } else {
          const existingCourse = parsed.courses[existingIdx];
          if (!existingCourse.lessons || existingCourse.lessons.length !== defaultCourse.lessons.length) {
            parsed.courses[existingIdx] = {
              ...existingCourse,
              title: defaultCourse.title,
              description: defaultCourse.description,
              positionCode: defaultCourse.positionCode,
              positionName: defaultCourse.positionName,
              rank: defaultCourse.rank,
              lessons: defaultCourse.lessons
            };
            updated = true;
          }
        }
      }
      if (!parsed.grades) {
        parsed.grades = [];
        updated = true;
      }
      if (!parsed.emails) {
        parsed.emails = [];
        updated = true;
      }
      if (!parsed.tickets) {
        parsed.tickets = defaultDB.tickets;
        updated = true;
      }
      if (!parsed.supportChannels) {
        parsed.supportChannels = defaultDB.supportChannels;
        updated = true;
      }
      if (!parsed.supportClients || parsed.supportClients.some((c: any) => c.name === 'Zara' || c.name === 'Mittivoj' || c.name === 'Mango') || parsed.supportClients.length < 9) {
        parsed.supportClients = defaultDB.supportClients;
        if (!parsed.supportStores || parsed.supportStores.length < 10) {
          parsed.supportStores = defaultDB.supportStores;
        }
        updated = true;
      }
      if (!parsed.supportStores) {
        parsed.supportStores = defaultDB.supportStores;
        updated = true;
      }
      if (!parsed.supportKinds) {
        parsed.supportKinds = defaultDB.supportKinds;
        updated = true;
      }

      if (parsed.tickets) {
        parsed.tickets.forEach((t: any) => {
          if (t.client === 'Mittivoj') {
            t.client = 'Mittivoy';
            updated = true;
          }
          if (t.client === 'LCW' && t.country === 'Казахстан') {
            t.country = 'Россия';
            t.requesterName = t.requesterName.replace('Алматы', 'Москва');
            updated = true;
          }
        });
      }

      if (parsed.employees) {
        for (const key of Object.keys(parsed.employees)) {
          const emp = parsed.employees[key];
          if (!emp.profile) {
            emp.profile = {};
          }
          if (!emp.profile.positionCode) {
            if (emp.role === 'admin') {
              emp.profile.positionCode = '00';
              emp.profile.positionName = 'CEO';
              emp.profile.department = 'RetMind';
            } else if (emp.profile.department && emp.profile.department.includes('Tier 2')) {
              emp.profile.positionCode = '08';
              emp.profile.positionName = 'DevOps';
              emp.profile.department = 'RetMind DevOps';
            } else {
              emp.profile.positionCode = '13';
              emp.profile.positionName = 'Support Specialist';
              emp.profile.department = 'RetMind Support';
            }
            updated = true;
          }
        }
      }
      if (updated) {
        writeDB(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database, resetting to default:', err);
  }
  // If not found or error, write default and return
  writeDB(defaultDB);
  return defaultDB;
}

function writeDB(data: LocalDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
  if (pgPool) {
    saveDBToPostgresAsync(data).catch((err) => console.error('Error syncing DB to PostgreSQL:', err));
  }
}

let pgPool: pg.Pool | null = null;
if (process.env.POSTGRES_HOST || process.env.DATABASE_URL) {
  const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'talgat',
      password: process.env.POSTGRES_PASSWORD || 'talgat',
      database: process.env.POSTGRES_DB || 'onb'
    };
  pgPool = new pg.Pool(poolConfig);
  pgPool.on('error', (err) => console.error('PostgreSQL Pool Error:', err));
}

async function loadDBFromPostgresAsync(): Promise<LocalDatabase | null> {
  if (!pgPool) return null;
  const client = await pgPool.connect();
  try {
    const depts = (await client.query('SELECT id, name FROM departments')).rows;
    const roles = (await client.query('SELECT code, name, system_role as "systemRole" FROM roles')).rows;
    const positions = (await client.query('SELECT code, name, department_id as "departmentId", role_code as "roleCode" FROM positions')).rows;
    
    let ranksRows: any[] = [];
    try {
      ranksRows = (await client.query('SELECT id, position_code as "positionCode", name, sort_order as "sortOrder" FROM ranks ORDER BY sort_order ASC, name ASC')).rows;
    } catch (e) {
      // Ignore if ranks table not created yet
    }
    const ranksByPos: Record<string, string[]> = {};
    for (const r of ranksRows) {
      if (!ranksByPos[r.positionCode]) ranksByPos[r.positionCode] = [];
      ranksByPos[r.positionCode].push(r.name);
    }

    const defaultPositions = defaultDB.positions || [];
    for (const pos of positions) {
      if (ranksByPos[pos.code] && ranksByPos[pos.code].length > 0) {
        pos.ranks = ranksByPos[pos.code];
      } else {
        const defPos = defaultPositions.find((p: any) => p.code === pos.code);
        if (defPos && defPos.ranks && defPos.ranks.length > 0) {
          pos.ranks = defPos.ranks;
          // Auto-seed into PostgreSQL ranks table
          for (let i = 0; i < defPos.ranks.length; i++) {
            const rName = defPos.ranks[i];
            const rId = `${pos.code}-${rName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            try {
              await client.query(
                `INSERT INTO ranks (id, position_code, name, sort_order)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
                [rId, pos.code, rName, i + 1]
              );
            } catch (e) {
              // Ignore if ranks table is not available
            }
          }
        } else {
          pos.ranks = [];
        }
      }
    }

    const employeesRows = (await client.query('SELECT id, email, name, role, status, created_at as "createdAt", password, profile FROM employees')).rows;
    const emails = (await client.query('SELECT id, to_email as "to", subject, body, token, sent_at as "sentAt", status FROM emails')).rows;
    const invitationsRows = (await client.query('SELECT id, employee_id as "employeeId", email, token, status, sent_at as "sentAt", expires_at as "expiresAt" FROM invitations')).rows;
    const courses = (await client.query('SELECT id, title, description, position_code as "positionCode", position_name as "positionName", rank, bindings, lessons, created_at as "createdAt", study_duration_days as "studyDurationDays", exam_duration_days as "examDurationDays" FROM courses')).rows;
    const grades = (await client.query('SELECT id, employee_id as "employeeId", course_id as "courseId", lesson_id as "lessonId", score, comment, graded_by as "gradedBy", graded_by_name as "gradedByName", graded_at as "gradedAt" FROM lesson_grades')).rows;
    const tickets = (await client.query('SELECT id, channel, client, country, creator_type as "creatorType", requester_name as "requesterName", subject, description, status, created_at as "createdAt", resolved_at as "resolvedAt", closed_at as "closedAt", assigned_to_id as "assignedToId", assigned_to_name as "assignedToName", resolution_comment as "resolutionComment", closed_by_id as "closedById", closed_by_name as "closedByName", system, module, type, action, kind, attachments, store_id as "storeId", store_name as "storeName", started_working_at as "startedWorkingAt", confirmed_at as "confirmedAt", confirmation_attachment as "confirmationAttachment" FROM tickets')).rows;
    const supportChannels = (await client.query('SELECT id, code, name FROM support_channels')).rows;
    const supportClients = (await client.query('SELECT id, name, countries FROM support_clients')).rows;
    const supportStores = (await client.query('SELECT id, name, client_id as "clientId", country, code, status FROM support_stores')).rows;
    const supportKinds = (await client.query('SELECT id, name FROM support_kinds')).rows;

    let supportCountries: SupportCountry[] = [];
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS support_countries (
            id VARCHAR(64) PRIMARY KEY,
            code VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(64) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      supportCountries = (await client.query('SELECT id, code, name, status FROM support_countries')).rows;
    } catch (e) {
      console.warn('Failed to ensure or query support_countries table:', e);
    }

    if (supportCountries.length === 0) {
      supportCountries = defaultDB.supportCountries || [];
      for (const sc of supportCountries) {
        try {
          await client.query(
            `INSERT INTO support_countries (id, code, name, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, status = EXCLUDED.status`,
            [sc.id, sc.code, sc.name, sc.status || 'active']
          );
        } catch (err) {
          // ignore
        }
      }
    }

    const employees: Record<string, Employee & { password?: string }> = {};
    for (const emp of employeesRows) {
      employees[emp.id] = {
        id: emp.id,
        email: emp.email,
        name: emp.name,
        role: emp.role,
        status: emp.status,
        createdAt: emp.createdAt,
        password: emp.password,
        profile: emp.profile || {}
      };
    }

    const invitations: Record<string, Invitation> = {};
    for (const inv of invitationsRows) {
      invitations[inv.id] = inv;
    }

    return {
      employees,
      emails,
      invitations,
      departments: depts,
      roles,
      positions,
      courses,
      grades,
      tickets,
      supportChannels,
      supportClients,
      supportStores,
      supportKinds,
      supportCountries
    };
  } catch (err) {
    console.error('Failed to load from PostgreSQL:', err);
    return null;
  } finally {
    client.release();
  }
}

async function saveDBToPostgresAsync(data: LocalDatabase) {
  if (!pgPool) return;
  try {
    for (const sc of data.supportCountries || []) {
      try {
        await pgPool.query(
          `INSERT INTO support_countries (id, code, name, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, status = EXCLUDED.status`,
          [sc.id, sc.code, sc.name, sc.status || 'active']
        );
      } catch (err) {
        // ignore if table not created yet
      }
    }

    for (const ch of data.supportChannels || []) {
      try {
        await pgPool.query(
          `INSERT INTO support_channels (id, code, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name`,
          [ch.id, ch.code, ch.name]
        );
      } catch (err) {}
    }

    for (const cl of data.supportClients || []) {
      try {
        await pgPool.query(
          `INSERT INTO support_clients (id, name, countries)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, countries = EXCLUDED.countries`,
          [cl.id, cl.name, JSON.stringify(cl.countries || [])]
        );
      } catch (err) {}
    }

    for (const st of data.supportStores || []) {
      try {
        await pgPool.query(
          `INSERT INTO support_stores (id, name, client_id, country, code, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name, client_id = EXCLUDED.client_id, country = EXCLUDED.country,
             code = EXCLUDED.code, status = EXCLUDED.status`,
          [st.id, st.name, st.clientId, st.country, st.code || null, st.status || 'active']
        );
      } catch (err) {}
    }

    for (const k of data.supportKinds || []) {
      try {
        await pgPool.query(
          `INSERT INTO support_kinds (id, name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [k.id, k.name]
        );
      } catch (err) {}
    }
    for (const pos of data.positions || []) {
      await pgPool.query(
        `INSERT INTO positions (code, name, department_id, role_code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name, department_id = EXCLUDED.department_id, role_code = EXCLUDED.role_code`,
        [pos.code, pos.name, pos.departmentId || null, pos.roleCode || null]
      );

      try {
        await pgPool.query(`DELETE FROM ranks WHERE position_code = $1`, [pos.code]);
        if (Array.isArray(pos.ranks) && pos.ranks.length > 0) {
          for (let i = 0; i < pos.ranks.length; i++) {
            const rName = pos.ranks[i];
            const rId = `${pos.code}-${rName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            await pgPool.query(
              `INSERT INTO ranks (id, position_code, name, sort_order)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
              [rId, pos.code, rName, i + 1]
            );
          }
        }
      } catch (e) {
        // Table ranks might not exist yet
      }
    }

    const empList = Object.values(data.employees || {});
    for (const emp of empList) {
      await pgPool.query(
        `INSERT INTO employees (id, email, name, role, status, created_at, password, profile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status,
           password = EXCLUDED.password, profile = EXCLUDED.profile`,
        [emp.id, emp.email, emp.name, emp.role, emp.status, emp.createdAt, emp.password || 'password123', JSON.stringify(emp.profile || {})]
      );
    }

    for (const c of data.courses || []) {
      await pgPool.query(
        `INSERT INTO courses (id, title, description, position_code, position_name, rank, bindings, lessons, created_at, study_duration_days, exam_duration_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description, position_code = EXCLUDED.position_code,
           position_name = EXCLUDED.position_name, rank = EXCLUDED.rank, bindings = EXCLUDED.bindings, lessons = EXCLUDED.lessons`,
        [c.id, c.title, c.description, c.positionCode || null, c.positionName || null, c.rank || null, JSON.stringify(c.bindings || []), JSON.stringify(c.lessons || []), c.createdAt, c.studyDurationDays || 7, c.examDurationDays || 3]
      );
    }

    for (const g of data.grades || []) {
      await pgPool.query(
        `INSERT INTO lesson_grades (id, employee_id, course_id, lesson_id, score, comment, graded_by, graded_by_name, graded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment, graded_at = EXCLUDED.graded_at`,
        [g.id, g.employeeId, g.courseId, g.lessonId, g.score, g.comment || '', g.gradedBy, g.gradedByName, g.gradedAt]
      );
    }

    for (const t of data.tickets || []) {
      await pgPool.query(
        `INSERT INTO tickets (
          id, channel, client, country, creator_type, requester_name, subject, description,
          status, created_at, resolved_at, closed_at, assigned_to_id, assigned_to_name,
          resolution_comment, closed_by_id, closed_by_name, system, module, type, action, kind,
          attachments, store_id, store_name, started_working_at, confirmed_at, confirmation_attachment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status, resolved_at = EXCLUDED.resolved_at, closed_at = EXCLUDED.closed_at,
          assigned_to_id = EXCLUDED.assigned_to_id, assigned_to_name = EXCLUDED.assigned_to_name,
          resolution_comment = EXCLUDED.resolution_comment, closed_by_id = EXCLUDED.closed_by_id,
          closed_by_name = EXCLUDED.closed_by_name, started_working_at = EXCLUDED.started_working_at,
          confirmed_at = EXCLUDED.confirmed_at, confirmation_attachment = EXCLUDED.confirmation_attachment`,
        [
          t.id, t.channel, t.client, t.country, t.creatorType, t.requesterName, t.subject, t.description,
          t.status, t.createdAt, t.resolvedAt || null, t.closedAt || null, t.assignedToId || null, t.assignedToName || null,
          t.resolutionComment || null, t.closedById || null, t.closedByName || null, t.system || null, t.module || null,
          t.type || null, t.action || null, t.kind || null, JSON.stringify(t.attachments || []), t.storeId || null,
          t.storeName || null, t.startedWorkingAt || null, t.confirmedAt || null, t.confirmationAttachment ? JSON.stringify(t.confirmationAttachment) : null
        ]
      );
    }
  } catch (err) {
    console.error('Error saving to PostgreSQL:', err);
  }
}

// Initialize server
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  if (pgPool) {
    try {
      const pgData = await loadDBFromPostgresAsync();
      if (pgData && pgData.departments && pgData.departments.length > 0) {
        fs.writeFileSync(DB_FILE, JSON.stringify(pgData, null, 2), 'utf8');
        console.log('✅ Loaded database state from PostgreSQL.');
      }
    } catch (err) {
      console.warn('⚠️ Could not load state from PostgreSQL, using local file:', err);
    }
  }

  // Ensure database exists
  readDB();

  // Helper middleware to authenticate from simulated Bearer token
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!token.startsWith('mock-token-')) {
      res.status(401).json({ error: 'Неверный токен' });
      return;
    }
    const userId = token.replace('mock-token-', '');
    const db = readDB();
    const user = db.employees[userId];
    if (!user) {
      res.status(401).json({ error: 'Пользователь не найден' });
      return;
    }
    (req as any).user = user;
    next();
  };

  // Admin validation middleware
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as Employee;
    if (user.role !== 'admin' && user.role !== 'manager') {
      res.status(403).json({ error: 'Доступ запрещен: требуется роль Администратора или Менеджера' });
      return;
    }
    next();
  };

  // --- API Endpoints ---

  // 1. Auth Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Укажите email и пароль' });
      return;
    }

    const db = readDB();
    const employee = Object.values(db.employees).find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (!employee || employee.password !== password) {
      res.status(401).json({ error: 'Неверные учетные данные' });
      return;
    }

    if (employee.status !== 'active') {
      res.status(403).json({ error: 'Ваш аккаунт еще не активирован. Проверьте почту для настройки пароля.' });
      return;
    }

    // Strip password from returned payload
    const { password: _, ...userWithoutPassword } = employee;

    res.json({
      user: userWithoutPassword,
      token: `mock-token-${employee.id}`
    });
  });

  // 2. Auth Me (Fetch Current Active Session)
  app.get('/api/auth/me', authenticateUser, (req, res) => {
    const user = (req as any).user;
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // 2b. Get Active Employees for Ticket Assignment (All authenticated users)
  app.get('/api/employees/active', authenticateUser, (req, res) => {
    const db = readDB();
    if (!db.employees) {
      return res.json([]);
    }
    const activeList = Object.values(db.employees)
      .filter((emp: any) => emp.status === 'active')
      .map(({ password: _, ...user }: any) => user);
    res.json(activeList);
  });

  // 3. Get All Employees (Admin only)
  app.get('/api/employees', authenticateUser, requireAdmin, (req, res) => {
    const db = readDB();
    const employeesList = Object.values(db.employees).map(({ password: _, ...user }) => user);
    res.json(employeesList);
  });

  // 4. Create New Employee & Send Invitation (Admin only)
  app.post('/api/employees', authenticateUser, requireAdmin, (req, res) => {
    const { name, email, department, specializations, phone, bio, positionCode, positionName, role, rank } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Имя и Email обязательны для заполнения' });
      return;
    }

    const db = readDB();
    const emailExists = Object.values(db.employees).some(emp => emp.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      res.status(400).json({ error: 'Сотрудник с таким email уже зарегистрирован' });
      return;
    }

    const id = 'emp-' + Math.random().toString(36).substr(2, 9);
    const token = 'token-' + Math.random().toString(36).substr(2, 16);

    const newEmployee: Employee = {
      id,
      email,
      name,
      role: role || 'employee',
      status: 'pending',
      createdAt: new Date().toISOString(),
      profile: {
        phone: phone || '',
        department: department || 'RetMind Support',
        specializations: specializations || [],
        bio: bio || '',
        avatarStyle: name.toLowerCase().replace(/\s+/g, '-'),
        positionCode: positionCode || '13',
        positionName: positionName || 'Support Specialist',
        rank: rank || ''
      }
    };

    // Save user
    db.employees[id] = newEmployee;

    // Create Onboarding Invitation
    const newInvitation: Invitation = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      employeeId: id,
      email,
      token,
      status: 'pending',
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // 7 days expiry
    };
    db.invitations[token] = newInvitation;

    // Simulate sending email by writing to simulated emails list
    const invitationLink = `/onboarding/${token}`;
    const emailBody = `Здравствуйте, ${name}!\n\nВас зарегистрировали на обучающей платформе поддержки.\nДля настройки учетной записи, пароля и активации аккаунта перейдите по следующей ссылке:\n\n${invitationLink}\n\nС уважением,\nКоманда Support Team Learning`;

    const newEmail: SimulatedEmail = {
      id: 'email-' + Math.random().toString(36).substr(2, 9),
      to: email,
      subject: 'Ваша учетная запись сотрудника поддержки готова',
      body: emailBody,
      token,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    db.emails.unshift(newEmail); // put latest first

    writeDB(db);

    const employeeWithoutPassword = newEmployee;
    res.status(201).json({
      employee: employeeWithoutPassword,
      invitation: newInvitation,
      simulatedEmail: newEmail
    });
  });

  // 5. Update Employee Profile (Admin can edit any, Employee can edit self)
  app.put('/api/employees/:id', authenticateUser, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as Employee;
    const { name, email, department, specializations, phone, bio, positionCode, positionName, role, rank } = req.body;

    // Authorization guard: Admin/Manager can edit any, Employee can edit self
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager' && currentUser.id !== id) {
      res.status(403).json({ error: 'Нет прав для редактирования этого профиля' });
      return;
    }

    const db = readDB();
    const targetEmployee = db.employees[id];
    if (!targetEmployee) {
      res.status(404).json({ error: 'Сотрудник не найден' });
      return;
    }

    // Admins/Managers can update emails and names, users can update profiles and names
    if (name) targetEmployee.name = name;
    if ((currentUser.role === 'admin' || currentUser.role === 'manager') && email) {
      // Check email uniqueness if modified
      if (email.toLowerCase() !== targetEmployee.email.toLowerCase()) {
        const emailExists = Object.values(db.employees).some(emp => emp.id !== id && emp.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
          res.status(400).json({ error: 'Этот email уже занят другим сотрудником' });
          return;
        }
        targetEmployee.email = email;
      }
    }

    if ((currentUser.role === 'admin' || currentUser.role === 'manager') && role) {
      targetEmployee.role = role;
    }

    // Ensure profile structure
    targetEmployee.profile = {
      ...targetEmployee.profile,
      phone: phone !== undefined ? phone : targetEmployee.profile.phone,
      department: department !== undefined ? department : targetEmployee.profile.department,
      specializations: specializations !== undefined ? specializations : targetEmployee.profile.specializations,
      bio: bio !== undefined ? bio : targetEmployee.profile.bio,
      positionCode: positionCode !== undefined ? positionCode : targetEmployee.profile.positionCode,
      positionName: positionName !== undefined ? positionName : targetEmployee.profile.positionName,
      rank: rank !== undefined ? rank : targetEmployee.profile.rank,
    };

    db.employees[id] = targetEmployee;
    writeDB(db);

    const { password: _, ...updatedWithoutPassword } = targetEmployee;
    res.json(updatedWithoutPassword);
  });

  // 6. Delete Employee Profile (Admin only, cannot delete self)
  app.delete('/api/employees/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as Employee;

    if (currentUser.id === id) {
      res.status(400).json({ error: 'Вы не можете удалить свою собственную учетную запись администратора' });
      return;
    }

    const db = readDB();
    if (!db.employees[id]) {
      res.status(404).json({ error: 'Сотрудник не найден' });
      return;
    }

    // Delete employee
    delete db.employees[id];

    // Delete associated invitations
    for (const token of Object.keys(db.invitations)) {
      if (db.invitations[token].employeeId === id) {
        delete db.invitations[token];
      }
    }

    writeDB(db);
    res.json({ success: true, message: 'Профиль сотрудника успешно удален' });
  });

  // 7. Get Simulated Emails Logs
  app.get('/api/emails', (req, res) => {
    const db = readDB();
    res.json(db.emails || []);
  });

  // Mark simulated email as read
  app.post('/api/emails/:id/read', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = (db.emails || []).findIndex(e => e.id === id);
    if (idx !== -1) {
      db.emails[idx].status = 'read';
      writeDB(db);
    }
    res.json({ success: true });
  });

  // 8. Validate Onboarding Token
  app.get('/api/onboarding/:token', (req, res) => {
    const { token } = req.params;
    const db = readDB();
    const invitation = db.invitations[token];

    if (!invitation || invitation.status !== 'pending') {
      res.status(400).json({ error: 'Неверный или просроченный токен приглашения' });
      return;
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      res.status(400).json({ error: 'Срок действия приглашения истек' });
      return;
    }

    const employee = db.employees[invitation.employeeId];
    if (!employee) {
      res.status(404).json({ error: 'Сотрудник не найден' });
      return;
    }

    const { password: _, ...employeeWithoutPassword } = employee;
    res.json({
      invitation,
      employee: employeeWithoutPassword
    });
  });

  // 9. Complete Onboarding (Set password & activate account)
  app.post('/api/onboarding/:token/activate', (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Пароль должен содержать не менее 6 символов' });
      return;
    }

    const db = readDB();
    const invitation = db.invitations[token];

    if (!invitation || invitation.status !== 'pending') {
      res.status(400).json({ error: 'Неверный или просроченный токен приглашения' });
      return;
    }

    const employee = db.employees[invitation.employeeId];
    if (!employee) {
      res.status(404).json({ error: 'Сотрудник для активации не найден' });
      return;
    }

    // Set employee password and activate
    employee.password = password;
    employee.status = 'active';
    db.employees[employee.id] = employee;

    // Accept invitation
    invitation.status = 'accepted';
    db.invitations[token] = invitation;

    writeDB(db);

    const { password: _, ...activatedUser } = employee;
    res.json({
      success: true,
      user: activatedUser,
      token: `mock-token-${employee.id}`
    });
  });

  // Dynamic Structure Recalculation Helpers
  const syncEmployeesWithPositions = (db: LocalDatabase) => {
    for (const emp of Object.values(db.employees)) {
      if (emp.profile && emp.profile.positionCode) {
        const pos = db.positions.find(p => p.code === emp.profile.positionCode);
        if (pos) {
          emp.profile.positionName = pos.name;

          const dept = db.departments.find(d => d.id === pos.departmentId);
          if (dept) {
            emp.profile.department = dept.name;
          }

          const role = db.roles.find(r => r.code === pos.roleCode);
          if (role) {
            if (emp.id === 'admin-1') {
              emp.role = 'admin';
            } else {
              emp.role = role.systemRole;
            }
          }
        }
      }
    }
  };

  // --- Departments CRUD ---
  app.get('/api/departments', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.departments);
  });

  app.post('/api/departments', authenticateUser, requireAdmin, (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Название подразделения обязательно' });
      return;
    }

    const db = readDB();
    const exists = db.departments.some(d => d.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      res.status(400).json({ error: 'Подразделение с таким названием уже существует' });
      return;
    }

    const newDept: DepartmentDefinition = {
      id: 'dept-' + Math.random().toString(36).substr(2, 9),
      name: name.trim()
    };

    db.departments.push(newDept);
    writeDB(db);
    res.status(211).json(newDept);
  });

  app.put('/api/departments/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Название подразделения обязательно' });
      return;
    }

    const db = readDB();
    const deptIdx = db.departments.findIndex(d => d.id === id);
    if (deptIdx === -1) {
      res.status(404).json({ error: 'Подразделение не найдено' });
      return;
    }

    const nameExists = db.departments.some(d => d.id !== id && d.name.toLowerCase() === name.trim().toLowerCase());
    if (nameExists) {
      res.status(400).json({ error: 'Другое подразделение с таким названием уже существует' });
      return;
    }

    db.departments[deptIdx].name = name.trim();
    syncEmployeesWithPositions(db);
    writeDB(db);
    res.json(db.departments[deptIdx]);
  });

  app.delete('/api/departments/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const deptIdx = db.departments.findIndex(d => d.id === id);
    if (deptIdx === -1) {
      res.status(404).json({ error: 'Подразделение не найдено' });
      return;
    }

    // Check if there are positions attached
    const hasPositions = db.positions.some(p => p.departmentId === id);
    if (hasPositions) {
      res.status(400).json({ error: 'Нельзя удалить подразделение, к которому привязаны должности. Сначала удалите или переместите должности.' });
      return;
    }

    db.departments.splice(deptIdx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Подразделение успешно удалено' });
  });


  // --- Roles CRUD ---
  app.get('/api/roles', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.roles);
  });

  app.post('/api/roles', authenticateUser, requireAdmin, (req, res) => {
    const { code, name, systemRole } = req.body;
    if (!code || !name || !systemRole) {
      res.status(400).json({ error: 'Код, название и системная роль обязательны' });
      return;
    }

    if (systemRole !== 'admin' && systemRole !== 'manager' && systemRole !== 'employee') {
      res.status(400).json({ error: 'Неверное значение системной роли' });
      return;
    }

    const db = readDB();
    const codeExists = db.roles.some(r => r.code.toLowerCase() === code.trim().toLowerCase());
    if (codeExists) {
      res.status(400).json({ error: 'Роль с таким кодом уже существует' });
      return;
    }

    const newRole: RoleDefinition = {
      code: code.trim(),
      name: name.trim(),
      systemRole
    };

    db.roles.push(newRole);
    writeDB(db);
    res.status(211).json(newRole);
  });

  app.put('/api/roles/:code', authenticateUser, requireAdmin, (req, res) => {
    const { code } = req.params;
    const { name, systemRole } = req.body;
    if (!name || !systemRole) {
      res.status(400).json({ error: 'Название и системная роль обязательны' });
      return;
    }

    if (systemRole !== 'admin' && systemRole !== 'manager' && systemRole !== 'employee') {
      res.status(400).json({ error: 'Неверное значение системной роли' });
      return;
    }

    const db = readDB();
    const roleIdx = db.roles.findIndex(r => r.code.toLowerCase() === code.toLowerCase());
    if (roleIdx === -1) {
      res.status(404).json({ error: 'Роль не найдена' });
      return;
    }

    // Default system roles protection
    if ((code === 'admin' || code === 'manager' || code === 'employee') && systemRole !== db.roles[roleIdx].systemRole) {
      res.status(400).json({ error: 'Нельзя изменять системную роль для базовых системных ролей "admin", "manager" и "employee"' });
      return;
    }

    db.roles[roleIdx].name = name.trim();
    db.roles[roleIdx].systemRole = systemRole;

    // Recalculate employee roles based on position changes
    syncEmployeesWithPositions(db);
    writeDB(db);
    res.json(db.roles[roleIdx]);
  });

  app.delete('/api/roles/:code', authenticateUser, requireAdmin, (req, res) => {
    const { code } = req.params;
    if (code === 'admin' || code === 'manager' || code === 'employee') {
      res.status(400).json({ error: 'Нельзя удалить базовые системные роли' });
      return;
    }

    const db = readDB();
    const roleIdx = db.roles.findIndex(r => r.code.toLowerCase() === code.toLowerCase());
    if (roleIdx === -1) {
      res.status(404).json({ error: 'Роль не найдена' });
      return;
    }

    // Check if any positions use this role
    const isRoleUsed = db.positions.some(p => p.roleCode.toLowerCase() === code.toLowerCase());
    if (isRoleUsed) {
      res.status(400).json({ error: 'Нельзя удалить роль, так как она назначена некоторым должностям' });
      return;
    }

    db.roles.splice(roleIdx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Роль успешно удалена' });
  });


  // --- Positions CRUD ---
  app.get('/api/positions', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.positions);
  });

  app.post('/api/positions', authenticateUser, requireAdmin, (req, res) => {
    const { code, name, departmentId, roleCode, ranks } = req.body;
    if (!code || !name || !departmentId || !roleCode) {
      res.status(400).json({ error: 'Все поля (код, название, подразделение, роль) обязательны' });
      return;
    }

    const db = readDB();
    const codeExists = db.positions.some(p => p.code.trim() === code.trim());
    if (codeExists) {
      res.status(400).json({ error: 'Должность с таким кодом уже существует' });
      return;
    }

    // Check department and role existence
    const deptExists = db.departments.some(d => d.id === departmentId);
    if (!deptExists) {
      res.status(400).json({ error: 'Указанное подразделение не существует' });
      return;
    }

    const roleExists = db.roles.some(r => r.code === roleCode);
    if (!roleExists) {
      res.status(400).json({ error: 'Указанная роль не существует' });
      return;
    }

    const newPos: PositionDefinition = {
      code: code.trim(),
      name: name.trim(),
      departmentId,
      roleCode,
      ranks: Array.isArray(ranks) ? ranks.map((r: any) => String(r).trim()).filter(Boolean) : undefined
    };

    db.positions.push(newPos);
    writeDB(db);
    res.status(211).json(newPos);
  });

  app.put('/api/positions/:code', authenticateUser, requireAdmin, (req, res) => {
    const { code } = req.params;
    const { name, departmentId, roleCode, ranks } = req.body;
    if (!name || !departmentId || !roleCode) {
      res.status(400).json({ error: 'Название, подразделение и роль обязательны для заполнения' });
      return;
    }

    const db = readDB();
    const posIdx = db.positions.findIndex(p => p.code === code);
    if (posIdx === -1) {
      res.status(404).json({ error: 'Должность не найдена' });
      return;
    }

    const deptExists = db.departments.some(d => d.id === departmentId);
    if (!deptExists) {
      res.status(400).json({ error: 'Указанное подразделение не существует' });
      return;
    }

    const roleExists = db.roles.some(r => r.code === roleCode);
    if (!roleExists) {
      res.status(400).json({ error: 'Указанная роль не существует' });
      return;
    }

    const oldRanks = db.positions[posIdx].ranks || [];
    const newRanks = Array.isArray(ranks) ? ranks.map((r: any) => String(r).trim()).filter(Boolean) : [];

    db.positions[posIdx].name = name.trim();
    db.positions[posIdx].departmentId = departmentId;
    db.positions[posIdx].roleCode = roleCode;
    db.positions[posIdx].ranks = newRanks.length > 0 ? newRanks : undefined;

    // Sync position name in all courses (both legacy fields and bindings array)
    for (const course of db.courses) {
      if (course.positionCode === code) {
        course.positionName = name.trim();
      }
      if (course.bindings && Array.isArray(course.bindings)) {
        for (const b of course.bindings) {
          if (b.positionCode === code) {
            b.positionName = name.trim();
          }
        }
      }
    }

    // Detect renamed or deleted ranks to cascade to employees and courses
    if (oldRanks.length > 0) {
      if (oldRanks.length === newRanks.length) {
        let diffIndex = -1;
        let diffCount = 0;
        for (let i = 0; i < oldRanks.length; i++) {
          if (oldRanks[i] !== newRanks[i]) {
            diffCount++;
            diffIndex = i;
          }
        }
        if (diffCount === 1) {
          const oldRankName = oldRanks[diffIndex];
          const newRankName = newRanks[diffIndex];

          // Cascade rename to employees
          for (const emp of Object.values(db.employees)) {
            if (emp.profile && emp.profile.positionCode === code && emp.profile.rank === oldRankName) {
              emp.profile.rank = newRankName;
            }
          }

          // Cascade rename to courses
          for (const course of db.courses) {
            if (course.positionCode === code && course.rank === oldRankName) {
              course.rank = newRankName;
            }
            if (course.bindings && Array.isArray(course.bindings)) {
              for (const b of course.bindings) {
                if (b.positionCode === code && b.rank === oldRankName) {
                  b.rank = newRankName;
                }
              }
            }
          }
        }
      } else {
        // If ranks list size changed or items deleted, clear rank for employees & courses that are no longer valid
        for (const emp of Object.values(db.employees)) {
          if (emp.profile && emp.profile.positionCode === code && emp.profile.rank) {
            if (!newRanks.includes(emp.profile.rank)) {
              emp.profile.rank = '';
            }
          }
        }
        for (const course of db.courses) {
          if (course.positionCode === code && course.rank) {
            if (!newRanks.includes(course.rank)) {
              course.rank = '';
            }
          }
          if (course.bindings && Array.isArray(course.bindings)) {
            for (const b of course.bindings) {
              if (b.positionCode === code && b.rank) {
                if (!newRanks.includes(b.rank)) {
                  b.rank = '';
                }
              }
            }
          }
        }
      }
    }

    // Cascade update to employees using this position
    syncEmployeesWithPositions(db);
    writeDB(db);
    res.json(db.positions[posIdx]);
  });

  app.delete('/api/positions/:code', authenticateUser, requireAdmin, (req, res) => {
    const { code } = req.params;
    const db = readDB();
    const posIdx = db.positions.findIndex(p => p.code === code);
    if (posIdx === -1) {
      res.status(404).json({ error: 'Должность не найдена' });
      return;
    }

    // Check if any employee is currently assigned to this position
    const isAssigned = Object.values(db.employees).some(emp => emp.profile && emp.profile.positionCode === code);
    if (isAssigned) {
      res.status(400).json({ error: 'Нельзя удалить должность, пока она назначена активным сотрудникам. Сначала переназначьте сотрудников.' });
      return;
    }

    db.positions.splice(posIdx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Должность успешно удалена' });
  });


  // --- Courses API Endpoints ---
  app.get('/api/courses', authenticateUser, (req, res) => {
    const user = (req as any).user as Employee;
    const db = readDB();

    if (user.role === 'admin' || user.role === 'manager') {
      res.json(db.courses);
    } else {
      // Filter courses based on user's position and optionally rank
      const posCode = user.profile.positionCode;
      const rank = user.profile.rank;

      const filtered = db.courses.filter(course => {
        // If course has bindings, check if any binding matches the employee's position and rank
        if (course.bindings && course.bindings.length > 0) {
          return course.bindings.some(binding => {
            if (binding.positionCode !== posCode) return false;
            if (binding.rank && binding.rank !== rank) return false;
            return true;
          });
        }

        // Fallback to legacy single positionCode / rank
        if (course.positionCode !== posCode) return false;
        if (course.rank && course.rank !== rank) return false;
        return true;
      });

      res.json(filtered);
    }
  });

  app.post('/api/courses', authenticateUser, requireAdmin, (req, res) => {
    const { title, description, positionCode, rank, bindings, lessons, studyDurationDays, examDurationDays } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Название курса обязательно для заполнения' });
      return;
    }

    const db = readDB();

    // Parse bindings
    let parsedBindings = Array.isArray(bindings) ? bindings.map((b: any) => {
      const pos = db.positions.find(p => p.code === b.positionCode);
      return {
        positionCode: String(b.positionCode || '').trim(),
        positionName: pos ? pos.name : 'Unknown Position',
        rank: b.rank ? String(b.rank).trim() : undefined
      };
    }).filter(b => b.positionCode) : [];

    // Fallback to legacy single positionCode
    if (parsedBindings.length === 0 && positionCode) {
      const pos = db.positions.find(p => p.code === positionCode);
      parsedBindings = [{
        positionCode: String(positionCode).trim(),
        positionName: pos ? pos.name : 'Unknown Position',
        rank: rank ? String(rank).trim() : undefined
      }];
    }

    if (parsedBindings.length === 0) {
      res.status(400).json({ error: 'Необходимо привязать курс хотя бы к одной должности' });
      return;
    }

    // Process lessons
    const parsedLessons: Lesson[] = Array.isArray(lessons) ? lessons.map((l: any, idx: number) => {
      return {
        id: l.id || `lesson-${Date.now()}-${idx}`,
        topic: String(l.topic || '').trim(),
        description: String(l.description || '').trim(),
        content: String(l.content || '').trim(),
        pdfUrl: String(l.pdfUrl || '').trim(),
        videoUrl: String(l.videoUrl || '').trim()
      };
    }).filter(l => l.topic) : [];

    const firstBinding = parsedBindings[0];

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: title.trim(),
      description: (description || '').trim(),
      positionCode: firstBinding.positionCode,
      positionName: firstBinding.positionName || '',
      rank: firstBinding.rank,
      bindings: parsedBindings,
      lessons: parsedLessons,
      studyDurationDays: studyDurationDays !== undefined ? Number(studyDurationDays) : 7,
      examDurationDays: examDurationDays !== undefined ? Number(examDurationDays) : 3,
      createdAt: new Date().toISOString()
    };

    db.courses.push(newCourse);
    writeDB(db);
    res.status(201).json(newCourse);
  });

  app.put('/api/courses/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, description, positionCode, rank, bindings, lessons, studyDurationDays, examDurationDays } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Название курса обязательно для заполнения' });
      return;
    }

    const db = readDB();
    const courseIdx = db.courses.findIndex(c => c.id === id);
    if (courseIdx === -1) {
      res.status(404).json({ error: 'Курс не найден' });
      return;
    }

    // Parse bindings
    let parsedBindings = Array.isArray(bindings) ? bindings.map((b: any) => {
      const pos = db.positions.find(p => p.code === b.positionCode);
      return {
        positionCode: String(b.positionCode || '').trim(),
        positionName: pos ? pos.name : 'Unknown Position',
        rank: b.rank ? String(b.rank).trim() : undefined
      };
    }).filter(b => b.positionCode) : [];

    // Fallback to legacy single positionCode
    if (parsedBindings.length === 0 && positionCode) {
      const pos = db.positions.find(p => p.code === positionCode);
      parsedBindings = [{
        positionCode: String(positionCode).trim(),
        positionName: pos ? pos.name : 'Unknown Position',
        rank: rank ? String(rank).trim() : undefined
      }];
    }

    if (parsedBindings.length === 0) {
      res.status(400).json({ error: 'Необходимо привязать курс хотя бы к одной должности' });
      return;
    }

    // Process lessons
    const parsedLessons: Lesson[] = Array.isArray(lessons) ? lessons.map((l: any, idx: number) => {
      return {
        id: l.id || `lesson-${Date.now()}-${idx}`,
        topic: String(l.topic || '').trim(),
        description: String(l.description || '').trim(),
        content: String(l.content || '').trim(),
        pdfUrl: String(l.pdfUrl || '').trim(),
        videoUrl: String(l.videoUrl || '').trim()
      };
    }).filter(l => l.topic) : [];

    const firstBinding = parsedBindings[0];

    db.courses[courseIdx] = {
      ...db.courses[courseIdx],
      title: title.trim(),
      description: (description || '').trim(),
      positionCode: firstBinding.positionCode,
      positionName: firstBinding.positionName || '',
      rank: firstBinding.rank,
      bindings: parsedBindings,
      lessons: parsedLessons,
      studyDurationDays: studyDurationDays !== undefined ? Number(studyDurationDays) : db.courses[courseIdx].studyDurationDays || 7,
      examDurationDays: examDurationDays !== undefined ? Number(examDurationDays) : db.courses[courseIdx].examDurationDays || 3
    };

    writeDB(db);
    res.json(db.courses[courseIdx]);
  });

  app.delete('/api/courses/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const courseIdx = db.courses.findIndex(c => c.id === id);
    if (courseIdx === -1) {
      res.status(404).json({ error: 'Курс не найден' });
      return;
    }

    db.courses.splice(courseIdx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Курс успешно удален' });
  });

  // --- Grades (Attestations) API Endpoints ---
  app.get('/api/grades', authenticateUser, (req, res) => {
    const user = (req as any).user as Employee;
    const db = readDB();

    if (user.role === 'admin' || user.role === 'manager') {
      res.json(db.grades || []);
    } else {
      const userGrades = (db.grades || []).filter(g => g.employeeId === user.id);
      res.json(userGrades);
    }
  });

  app.post('/api/grades', authenticateUser, requireAdmin, (req, res) => {
    const currentUser = (req as any).user as Employee;
    const { employeeId, courseId, lessonId, score, comment } = req.body;

    if (!employeeId || !courseId || !lessonId) {
      res.status(400).json({ error: 'Идентификатор сотрудника, курса и урока обязательны' });
      return;
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
      res.status(400).json({ error: 'Оценка должна быть числом от 1 до 10' });
      return;
    }

    const db = readDB();

    // Verify employee exists
    if (!db.employees[employeeId]) {
      res.status(400).json({ error: 'Сотрудник не найден' });
      return;
    }

    // Verify course and lesson exist
    const course = db.courses.find(c => c.id === courseId);
    if (!course) {
      res.status(400).json({ error: 'Курс не найден' });
      return;
    }

    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      res.status(400).json({ error: 'Урок не найден в указанном курсе' });
      return;
    }

    if (!db.grades) {
      db.grades = [];
    }

    // Check if grade already exists
    const existingIdx = db.grades.findIndex(
      g => g.employeeId === employeeId && g.courseId === courseId && g.lessonId === lessonId
    );

    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      db.grades[existingIdx] = {
        ...db.grades[existingIdx],
        score: numericScore,
        comment: comment !== undefined ? String(comment).trim() : db.grades[existingIdx].comment,
        gradedBy: currentUser.id,
        gradedByName: currentUser.name,
        gradedAt: now
      };
      writeDB(db);
      res.json(db.grades[existingIdx]);
    } else {
      const newGrade: LessonGrade = {
        id: `grade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        employeeId,
        courseId,
        lessonId,
        score: numericScore,
        comment: comment !== undefined ? String(comment).trim() : '',
        gradedBy: currentUser.id,
        gradedByName: currentUser.name,
        gradedAt: now
      };
      db.grades.push(newGrade);
      writeDB(db);
      res.status(211).json(newGrade);
    }
  });

  // --- Tickets API Endpoints (Ticket Academy) ---
  app.get('/api/tickets', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.tickets || []);
  });

  app.post('/api/tickets', authenticateUser, (req, res) => {
    const { channel, client, country, creatorType, requesterName, subject, description, system, module, type, action, kind, attachments, storeId, storeName, createdAt, startedWorkingAt, closedAt, confirmedAt, confirmationAttachment, assignedToId, assignedToName } = req.body;

    if (!channel || !client || !country || !creatorType || !subject) {
      res.status(400).json({ error: 'Все обязательные поля (канал связи, клиент, страна присутствия, тип заявителя, тема обращения) должны быть заполнены' });
      return;
    }

    const db = readDB();
    if (!db.tickets) {
      db.tickets = [];
    }

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      channel,
      client,
      country,
      creatorType,
      requesterName: requesterName || '',
      subject,
      description: description || '',
      status: 'open',
      createdAt: createdAt || new Date().toISOString(),
      system: system || '',
      module: module || '',
      type: type || '',
      action: action || '',
      kind: kind || '',
      attachments: attachments || [],
      storeId: storeId || undefined,
      storeName: storeName || undefined,
      startedWorkingAt: startedWorkingAt || undefined,
      closedAt: closedAt || undefined,
      confirmedAt: confirmedAt || undefined,
      confirmationAttachment: confirmationAttachment || undefined,
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToName || undefined
    };

    db.tickets.unshift(newTicket);
    writeDB(db);
    res.status(201).json(newTicket);
  });

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash"
];

function formatGeminiError(err: any): string {
  let rawMsg = err?.message || String(err);
  try {
    if (typeof rawMsg === 'string' && rawMsg.trim().startsWith('{')) {
      const parsed = JSON.parse(rawMsg.trim());
      if (parsed?.error?.message) {
        rawMsg = parsed.error.message;
      }
    }
  } catch (e) {
    // Ignore JSON parse error
  }
  
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('prepayment credits') || rawMsg.includes('Quota exceeded')) {
    return 'Закончились бесплатные лимиты / баланс ключа Gemini API. Пополните баланс или обновите GEMINI_API_KEY в .env.';
  }
  return rawMsg;
}

async function generateGeminiContent(ai: any, params: any) {
  let lastError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('403')) {
        throw err;
      }
      console.warn(`[Gemini] Модель ${model} вернула ошибку:`, msg);
      lastError = err;
    }
  }
  throw lastError;
}

  app.post('/api/tickets/voice-analyze', authenticateUser, async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) {
        res.status(400).json({ error: 'Аудиоданные не получены' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: 'Ключ API Gemini не настроен на сервере' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const db = readDB();
      const validClients = db.supportClients?.map(c => c.name) || [];
      const validStores = db.supportStores?.map(s => ({ id: s.id, name: s.name, code: s.code, clientId: s.clientId })) || [];
      const validKinds = db.supportKinds?.map(k => k.name) || [];

      const serverTime = new Date();
      const tzoffset = serverTime.getTimezoneOffset() * 60000;
      const currentDatetime = (new Date(serverTime.getTime() - tzoffset)).toISOString().slice(0, 16);

      const prompt = `Ты — интеллектуальный ассистент службы поддержки. Твоя задача — прослушать голосовое сообщение на русском языке, в котором пользователь описывает проблему, и извлечь структурированную информацию для создания тикета (обращения).

Список доступных систем, модулей и типов (классификация):
${JSON.stringify(TICKET_CATEGORIES, null, 2)}

Список доступных клиентов (брендов):
${JSON.stringify(validClients, null, 2)}

Список доступных магазинов:
${JSON.stringify(validStores, null, 2)}

Список доступных видов обращений (kind):
${JSON.stringify(validKinds, null, 2)}

Инструкции по извлечению:
1. "requesterName": ФИО или имя человека, который обратился с заявкой к нашей тех поддержке.
2. "client": выбери НАИБОЛЕЕ точное название клиента из списка доступных клиентов. Если не упоминается, подбери из выбранного магазина, магазин привязан к клиенту.
3. "storeId": если упоминается конкретный магазин (по имени, адресу или коду типа K201/C140), найди его ID в списке доступных магазинов и верни этот ID. Если упомянуты "все магазины" или "весь список", укажи "all". 
4. "subject": сформулируй краткую и понятную тему обращения на русском языке (до 8-10 слов).
5. "description": подробно опиши проблему на русском языке так, как она изложена в аудио.
6. "system": определи подходящую систему из списка CategorySystem (например: BO, FO, LCW-TEAMS, MP, PC и т.д.). Если что то связанно с розницей, Back Office или работа с документами поступления, перемещения, приемка товаров то обычно это связано с BO (Back Office). Если это связано с торговыми точками, с продажами, чеками, ценами, с закрытием смены, кассы, видами оплат, или операциями связанное с торговой точкой, больше вероятности что это FO (Front Office). Если это связанно с маркетплейсами MP (Market Place). Если это связано с данными сотрудников, или с доступом сотрудников то скорее всего это HR (Human Resources). Если это связано с техникой, компьютер, принтер, сеть, связь настройки оборудований, с подключением то это скорее всего PC. Если это связано с Маркировками, честным знаком то это T&T.
7. "module": определи подходящий модуль из списка CategoryModule выбранной системы. Проанализировав задачу, постарайся найти самое подходящий модуль системы.
8. "type": определи подходящий тип из списка CategoryType выбранного модуля.
9. "action": определи подходящее действие из списка действий выбранного типа (если есть в списке).
10. "kind": выбери наиболее подходящий вид обращения из списка доступных видов (например: Ошибка, Консультация, Доработка и т.д.) или определи по смыслу.
11. "datetime": дата и время обращения или возникновения проблемы (в формате "YYYY-MM-DDTHH:MM"). Постарайся найти или вычислить эту дату и время из аудио (например, "вчера в два часа дня" или "сегодня утром в 9") относительно текущего времени сервера: ${currentDatetime}. Если упоминаний о дате и времени нет, оставь это поле пустым или null.

Верни ответ в строго соответствующем JSON-формате. Всегда старайся сопоставить извлеченные данные со справочниками (классификацией систем, клиентами, магазинами). Если совпадений нет, подбери наиболее логически близкое.`;

      const cleanAudioBase64 = audio.includes('base64,') ? audio.split('base64,')[1] : audio;

      const response = await generateGeminiContent(ai, {
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
              data: cleanAudioBase64,
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requesterName: { type: Type.STRING },
              client: { type: Type.STRING },
              storeId: { type: Type.STRING },
              subject: { type: Type.STRING },
              description: { type: Type.STRING },
              system: { type: Type.STRING },
              module: { type: Type.STRING },
              type: { type: Type.STRING },
              action: { type: Type.STRING },
              kind: { type: Type.STRING },
              datetime: { type: Type.STRING }
            },
            required: ["subject", "description"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('Модель не вернула ответ');
      }

      res.json(JSON.parse(resultText.trim()));
    } catch (err: any) {
      console.error('Ошибка распознавания голоса Gemini:', err);
      const cleanError = formatGeminiError(err);
      res.status(500).json({ error: `Не удалось распознать голосовое сообщение: ${cleanError}` });
    }
  });

  app.post('/api/tickets/image-analyze', authenticateUser, async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        res.status(400).json({ error: 'Изображение не получено' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: 'Ключ API Gemini не настроен на сервере' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const db = readDB();
      const validClients = db.supportClients?.map(c => c.name) || [];
      const validStores = db.supportStores?.map(s => ({ id: s.id, name: s.name, code: s.code, clientId: s.clientId })) || [];
      const validKinds = db.supportKinds?.map(k => k.name) || [];

      const serverTime = new Date();
      const tzoffset = serverTime.getTimezoneOffset() * 60000;
      const currentDatetime = (new Date(serverTime.getTime() - tzoffset)).toISOString().slice(0, 16);

      const prompt = `Ты — интеллектуальный ассистент службы поддержки. Твоя задача — внимательно проанализировать скриншот (изображение), на котором показана ошибка, системный экран, переписка или описание проблемы, и извлечь структурированную информацию для создания тикета (обращения).

Список доступных систем, модулей и типов (классификация):
${JSON.stringify(TICKET_CATEGORIES, null, 2)}

Список доступных клиентов (брендов):
${JSON.stringify(validClients, null, 2)}

Список доступных магазинов:
${JSON.stringify(validStores, null, 2)}

Список доступных видов обращений (kind):
${JSON.stringify(validKinds, null, 2)}

Инструкции по извлечению:
1. "requesterName": ФИО или имя человека, который обратился с заявкой к нашей тех поддержке (если видно на скриншоте или в чате).
2. "client": выбери НАИБОЛЕЕ точное название клиента из списка доступных клиентов. Если не упоминается, подбери из выбранного магазина, магазин привязан к клиенту.
3. "storeId": если на скриншоте упоминается конкретный магазин (по имени, адресу или коду типа K201/C140), найди его ID в списке доступных магазинов и верни этот ID. Если упомянуты "все магазины" или "весь список", укажи "all". 
4. "subject": сформулируй краткую и понятную тему обращения на русском языке (до 8-10 слов) на основе ошибки или проблемы, изображенной на скриншоте.
5. "description": подробно опиши проблему на русском языке так, как она видна на изображении (текст ошибки, контекст, детали экрана).
6. "system": определи подходящую систему из списка CategorySystem (например: BO, FO, LCW-TEAMS, MP, PC и т.д.). Если что то связанно с розницей, Back Office или работа с документами поступления, перемещения, приемка товаров то обычно это связано с BO (Back Office). Если это связано с торговыми точками, с продажами, чеками, ценами, с закрытием смены, кассы, видами оплат, или операциями связанное с торговой точкой, больше вероятности что это FO (Front Office). Если это связанно с маркетплейсами MP (Market Place). Если это связано с данными сотрудников, или с доступом сотрудников то скорее всего это HR (Human Resources). Если это связано с техникой, компьютер, принтер, сеть, связь настройки оборудований, с подключением то это скорее всего PC. Если это связано с Маркировками, честным знаком то это T&T.
7. "module": определи подходящий модуль из списка CategoryModule выбранной системы. Проанализировав задачу, постарайся найти самое подходящий модуль системы.
8. "type": определи подходящий тип из списка CategoryType выбранного модуля.
9. "action": определи подходящее действие из списка действий выбранного типа (если есть в списке).
10. "kind": выбери наиболее подходящий вид обращения из списка доступных видов (например: Ошибка, Консультация, Доработка и т.д.) или определи по смыслу.
11. "datetime": дата и время обращения или возникновения проблемы (в формате "YYYY-MM-DDTHH:MM"). Постарайся найти или вычислить эту дату и время со скриншота (например, системные часы в правом нижнем углу трея Windows, дата/время ошибки, штамп времени в чате, и т.д.) относительно текущего времени сервера: ${currentDatetime}. Если точная дата/время не видна, оставь это поле пустым или null.

Верни ответ в строго соответствующем JSON-формате. Всегда старайся сопоставить извлеченные данные со справочниками (классификацией систем, клиентами, магазинами). Если совпадений нет, подбери наиболее логически близкое.`;

      const cleanImageBase64 = image.includes('base64,') ? image.split('base64,')[1] : image;

      const response = await generateGeminiContent(ai, {
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/png",
              data: cleanImageBase64,
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requesterName: { type: Type.STRING },
              client: { type: Type.STRING },
              storeId: { type: Type.STRING },
              subject: { type: Type.STRING },
              description: { type: Type.STRING },
              system: { type: Type.STRING },
              module: { type: Type.STRING },
              type: { type: Type.STRING },
              action: { type: Type.STRING },
              kind: { type: Type.STRING },
              datetime: { type: Type.STRING }
            },
            required: ["subject", "description"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('Модель не вернула ответ');
      }

      res.json(JSON.parse(resultText.trim()));
    } catch (err: any) {
      console.error('Ошибка распознавания изображения Gemini:', err);
      const cleanError = formatGeminiError(err);
      res.status(500).json({ error: `Не удалось распознать скриншот: ${cleanError}` });
    }
  });

  app.put('/api/tickets/:id', authenticateUser, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as Employee;
    const { channel, client, country, creatorType, requesterName, subject, description, status, assignedToId, assignedToName, resolutionComment, system, module, type, action, kind, attachments, storeId, storeName, createdAt, startedWorkingAt, closedAt, confirmedAt, confirmationAttachment } = req.body;

    const db = readDB();
    if (!db.tickets) {
      db.tickets = [];
    }

    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Тикет не найден' });
      return;
    }

    const ticket = db.tickets[idx];

    if (channel) ticket.channel = channel;
    if (client) ticket.client = client;
    if (country) ticket.country = country;
    if (creatorType) ticket.creatorType = creatorType;
    if (requesterName) ticket.requesterName = requesterName;
    if (subject) ticket.subject = subject;
    if (description !== undefined) ticket.description = description;
    if (system !== undefined) ticket.system = system;
    if (module !== undefined) ticket.module = module;
    if (type !== undefined) ticket.type = type;
    if (action !== undefined) ticket.action = action;
    if (kind !== undefined) ticket.kind = kind;

    if (storeId !== undefined) ticket.storeId = storeId || undefined;
    if (storeName !== undefined) ticket.storeName = storeName || undefined;
    if (createdAt !== undefined) ticket.createdAt = createdAt;
    if (startedWorkingAt !== undefined) ticket.startedWorkingAt = startedWorkingAt || undefined;
    if (closedAt !== undefined) ticket.closedAt = closedAt || undefined;
    if (confirmedAt !== undefined) ticket.confirmedAt = confirmedAt || undefined;
    if (confirmationAttachment !== undefined) ticket.confirmationAttachment = confirmationAttachment || undefined;

    if (status && status !== ticket.status) {
      ticket.status = status;

      if (status === 'resolved') {
        ticket.resolvedAt = new Date().toISOString();
        if (resolutionComment) {
          ticket.resolutionComment = resolutionComment;
        }
        if (!ticket.assignedToId) {
          ticket.assignedToId = currentUser.id;
          ticket.assignedToName = currentUser.name;
        }
      } else if (status === 'closed') {
        ticket.closedAt = closedAt || new Date().toISOString();
        ticket.closedById = currentUser.id;
        ticket.closedByName = currentUser.name;

        if (!ticket.resolvedAt) {
          ticket.resolvedAt = new Date().toISOString();
        }
        if (!ticket.assignedToId) {
          ticket.assignedToId = currentUser.id;
          ticket.assignedToName = currentUser.name;
        }
      } else if (status === 'open') {
        ticket.resolvedAt = undefined;
        ticket.closedAt = undefined;
        ticket.closedById = undefined;
        ticket.closedByName = undefined;
      }
    }

    if (assignedToId !== undefined) {
      ticket.assignedToId = assignedToId;
      ticket.assignedToName = assignedToName || '';
    }

    if (resolutionComment !== undefined) {
      ticket.resolutionComment = resolutionComment;
    }

    if (attachments !== undefined) {
      ticket.attachments = attachments;
    }

    db.tickets[idx] = ticket;
    writeDB(db);
    res.json(ticket);
  });

  app.delete('/api/tickets/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    if (!db.tickets) {
      db.tickets = [];
    }

    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Тикет не найден' });
      return;
    }

    db.tickets.splice(idx, 1);
    writeDB(db);
    res.json({ success: true, message: 'Тикет успешно удален' });
  });

  // --- Ticket Academy Take and Status Endpoints (For Employee Dashboard compatibility) ---
  app.post('/api/tickets/:id/take', authenticateUser, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as Employee;
    const db = readDB();
    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Тикет не найден' });
      return;
    }
    db.tickets[idx].assignedToId = currentUser.id;
    db.tickets[idx].assignedToName = currentUser.name;
    if (!db.tickets[idx].startedWorkingAt) {
      db.tickets[idx].startedWorkingAt = new Date().toISOString();
    }
    writeDB(db);
    res.json(db.tickets[idx]);
  });

  app.put('/api/tickets/:id/status', authenticateUser, (req, res) => {
    const { id } = req.params;
    const { status, comment, startedWorkingAt, closedAt, confirmedAt, confirmationAttachment } = req.body;
    const currentUser = (req as any).user as Employee;
    const db = readDB();
    const idx = db.tickets.findIndex(t => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Тикет не найден' });
      return;
    }
    const ticket = db.tickets[idx];
    if (startedWorkingAt !== undefined) ticket.startedWorkingAt = startedWorkingAt || undefined;
    if (closedAt !== undefined) ticket.closedAt = closedAt || undefined;
    if (confirmedAt !== undefined) ticket.confirmedAt = confirmedAt || undefined;
    if (confirmationAttachment !== undefined) ticket.confirmationAttachment = confirmationAttachment || undefined;

    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date().toISOString();
        if (comment) {
          ticket.resolutionComment = comment;
        }
        if (!ticket.assignedToId) {
          ticket.assignedToId = currentUser.id;
          ticket.assignedToName = currentUser.name;
        }
      } else if (status === 'closed') {
        ticket.closedAt = closedAt || ticket.closedAt || new Date().toISOString();
        ticket.closedById = currentUser.id;
        ticket.closedByName = currentUser.name;
        if (!ticket.resolvedAt) {
          ticket.resolvedAt = new Date().toISOString();
        }
        if (!ticket.assignedToId) {
          ticket.assignedToId = currentUser.id;
          ticket.assignedToName = currentUser.name;
        }
      } else if (status === 'open') {
        ticket.resolvedAt = undefined;
        ticket.closedAt = undefined;
        ticket.closedById = undefined;
        ticket.closedByName = undefined;
      }
    }
    writeDB(db);
    res.json(ticket);
  });

  // --- Support Channels CRUD ---
  app.get('/api/support-channels', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.supportChannels || []);
  });

  app.post('/api/support-channels', authenticateUser, requireAdmin, (req, res) => {
    const { code, name } = req.body;
    if (!code || !name) {
      res.status(400).json({ error: 'Код и Название канала обязательны' });
      return;
    }
    const db = readDB();
    if (!db.supportChannels) db.supportChannels = [];
    const newChannel: SupportChannel = {
      id: `channel-${Date.now()}`,
      code: code.trim(),
      name: name.trim()
    };
    db.supportChannels.push(newChannel);
    writeDB(db);
    res.status(201).json(newChannel);
  });

  app.put('/api/support-channels/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { code, name } = req.body;
    const db = readDB();
    const idx = db.supportChannels.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Канал связи не найден' });
      return;
    }
    if (code) db.supportChannels[idx].code = code.trim();
    if (name) db.supportChannels[idx].name = name.trim();
    writeDB(db);
    res.json(db.supportChannels[idx]);
  });

  app.delete('/api/support-channels/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.supportChannels.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Канал связи не найден' });
      return;
    }
    db.supportChannels.splice(idx, 1);
    writeDB(db);
    if (pgPool) {
      pgPool.query('DELETE FROM support_channels WHERE id = $1', [id]).catch(e => console.error(e));
    }
    res.json({ success: true, message: 'Канал связи успешно удален' });
  });

  // --- Support Clients CRUD ---
  app.get('/api/support-clients', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.supportClients || []);
  });

  app.post('/api/support-clients', authenticateUser, requireAdmin, (req, res) => {
    const { name, countries } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Название клиента обязательно' });
      return;
    }
    const db = readDB();
    if (!db.supportClients) db.supportClients = [];
    const newClient: SupportClient = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      countries: Array.isArray(countries) ? countries.map(c => String(c).trim()).filter(Boolean) : []
    };
    db.supportClients.push(newClient);
    writeDB(db);
    res.status(201).json(newClient);
  });

  app.put('/api/support-clients/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, countries } = req.body;
    const db = readDB();
    const idx = db.supportClients.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Клиент не найден' });
      return;
    }
    if (name) db.supportClients[idx].name = name.trim();
    if (countries !== undefined) {
      db.supportClients[idx].countries = Array.isArray(countries) ? countries.map(c => String(c).trim()).filter(Boolean) : [];
    }
    writeDB(db);
    res.json(db.supportClients[idx]);
  });

  app.delete('/api/support-clients/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.supportClients.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Клиент не найден' });
      return;
    }
    db.supportClients.splice(idx, 1);
    writeDB(db);
    if (pgPool) {
      pgPool.query('DELETE FROM support_clients WHERE id = $1', [id]).catch(e => console.error(e));
    }
    res.json({ success: true, message: 'Клиент успешно удален' });
  });

  // --- Support Stores CRUD ---
  app.get('/api/support-stores', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.supportStores || []);
  });

  app.post('/api/support-stores', authenticateUser, requireAdmin, (req, res) => {
    const { name, clientId, country, code, status } = req.body;
    if (!name || !clientId || !country) {
      res.status(400).json({ error: 'Название магазина, ID клиента и страна обязательны' });
      return;
    }
    const db = readDB();
    if (!db.supportStores) db.supportStores = [];
    const newStore: SupportStore = {
      id: `store-${Date.now()}`,
      name: name.trim(),
      clientId,
      country,
      code: code ? code.trim() : undefined,
      status: status || 'active'
    };
    db.supportStores.push(newStore);
    writeDB(db);
    res.status(201).json(newStore);
  });

  app.put('/api/support-stores/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, clientId, country, code, status } = req.body;
    const db = readDB();
    const idx = db.supportStores.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Магазин не найден' });
      return;
    }
    if (name) db.supportStores[idx].name = name.trim();
    if (clientId) db.supportStores[idx].clientId = clientId;
    if (country) db.supportStores[idx].country = country;
    db.supportStores[idx].code = code !== undefined ? (code ? code.trim() : undefined) : db.supportStores[idx].code;
    db.supportStores[idx].status = status !== undefined ? status : db.supportStores[idx].status;
    writeDB(db);
    res.json(db.supportStores[idx]);
  });

  app.delete('/api/support-stores/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.supportStores.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Магазин не найден' });
      return;
    }
    db.supportStores.splice(idx, 1);
    writeDB(db);
    if (pgPool) {
      pgPool.query('DELETE FROM support_stores WHERE id = $1', [id]).catch(e => console.error(e));
    }
    res.json({ success: true, message: 'Магазин успешно удален' });
  });

  // --- Support Kinds CRUD ---
  app.get('/api/support-kinds', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.supportKinds || []);
  });

  app.post('/api/support-kinds', authenticateUser, requireAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Название вида обязательно' });
      return;
    }
    const db = readDB();
    if (!db.supportKinds) db.supportKinds = [];
    const newKind: SupportKind = {
      id: `kind-${Date.now()}`,
      name: name.trim()
    };
    db.supportKinds.push(newKind);
    writeDB(db);
    res.status(201).json(newKind);
  });

  app.put('/api/support-kinds/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const db = readDB();
    const idx = db.supportKinds.findIndex(k => k.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Вид тикета не найден' });
      return;
    }
    if (name) db.supportKinds[idx].name = name.trim();
    writeDB(db);
    res.json(db.supportKinds[idx]);
  });

  app.delete('/api/support-kinds/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.supportKinds.findIndex(k => k.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Вид тикета не найден' });
      return;
    }
    db.supportKinds.splice(idx, 1);
    writeDB(db);
    if (pgPool) {
      pgPool.query('DELETE FROM support_kinds WHERE id = $1', [id]).catch(e => console.error(e));
    }
    res.json({ success: true, message: 'Вид тикета успешно удален' });
  });

  // --- Support Countries CRUD ---
  app.get('/api/support-countries', authenticateUser, (req, res) => {
    const db = readDB();
    res.json(db.supportCountries || []);
  });

  app.post('/api/support-countries', authenticateUser, requireAdmin, (req, res) => {
    const { code, name } = req.body;
    if (!code || !name) {
      res.status(400).json({ error: 'Код страны и название обязательны' });
      return;
    }
    const db = readDB();
    if (!db.supportCountries) db.supportCountries = [];
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (db.supportCountries.some(c => c.code === cleanCode)) {
      res.status(400).json({ error: `Страна с кодом "${cleanCode}" уже существует` });
      return;
    }
    const newCountry: SupportCountry = {
      id: `country-${cleanCode.toLowerCase()}`,
      code: cleanCode,
      name: cleanName,
      status: 'active'
    };
    db.supportCountries.push(newCountry);
    writeDB(db);
    res.status(201).json(newCountry);
  });

  app.put('/api/support-countries/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { code, name, status } = req.body;
    const db = readDB();
    const idx = db.supportCountries.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Страна не найдена' });
      return;
    }
    if (code) db.supportCountries[idx].code = code.trim().toUpperCase();
    if (name) db.supportCountries[idx].name = name.trim();
    if (status) db.supportCountries[idx].status = status;
    writeDB(db);
    res.json(db.supportCountries[idx]);
  });

  app.delete('/api/support-countries/:id', authenticateUser, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.supportCountries.findIndex(c => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Страна не найдена' });
      return;
    }
    const countryObj = db.supportCountries[idx];
    const isUsedInStores = (db.supportStores || []).some(s => s.country === countryObj.name);
    if (isUsedInStores) {
      res.status(400).json({ error: `Нельзя удалить страну "${countryObj.name}", так как к ней привязаны действующие магазины.` });
      return;
    }
    db.supportCountries.splice(idx, 1);
    writeDB(db);
    if (pgPool) {
      pgPool.query('DELETE FROM support_countries WHERE id = $1', [id]).catch(e => console.error(e));
    }
    res.json({ success: true, message: 'Страна успешно удалена' });
  });


  // --- Vite dev server middleware integration & static build routing ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Support Learning Platform Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
});
