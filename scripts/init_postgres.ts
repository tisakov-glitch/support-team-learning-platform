/**
 * PostgreSQL Database Initialization and Migration Script
 * Reads schema.sql and database.json to populate the PostgreSQL database.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'talgat',
  password: process.env.POSTGRES_PASSWORD || 'talgat',
  database: process.env.POSTGRES_DB || 'onb',
  connectionString: process.env.DATABASE_URL
};

async function ensureDatabaseExists() {
  if (dbConfig.connectionString) return;

  const adminClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );
    if (res.rowCount === 0) {
      console.log(`Creating database "${dbConfig.database}"...`);
      await adminClient.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`Database "${dbConfig.database}" created successfully.`);
    } else {
      console.log(`Database "${dbConfig.database}" already exists.`);
    }
  } catch (err: any) {
    console.warn(`Warning checking/creating database: ${err.message}`);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function runMigration() {
  console.log('🚀 Starting PostgreSQL Database Initialization & Data Migration...');

  await ensureDatabaseExists();

  const clientConfig = dbConfig.connectionString
    ? { connectionString: dbConfig.connectionString }
    : {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database
      };

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log(`✅ Connected to PostgreSQL database "${dbConfig.database}"`);

    // 1. Run DDL Schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📜 Applying database schema (schema.sql)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Tables created/verified successfully.');
    } else {
      console.error('❌ schema.sql not found at', schemaPath);
      process.exit(1);
    }

    // 2. Read database.json
    const dbJsonPath = path.join(rootDir, 'database.json');
    if (!fs.existsSync(dbJsonPath)) {
      console.error('❌ database.json not found at', dbJsonPath);
      process.exit(1);
    }

    console.log('📦 Reading source data from database.json...');
    const rawData = fs.readFileSync(dbJsonPath, 'utf8');
    const data = JSON.parse(rawData);

    // 3. Populate Departments
    if (Array.isArray(data.departments)) {
      console.log(`📥 Migrating ${data.departments.length} departments...`);
      for (const dept of data.departments) {
        await client.query(
          `INSERT INTO departments (id, name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [dept.id, dept.name]
        );
      }
    }

    // 4. Populate Roles
    if (Array.isArray(data.roles)) {
      console.log(`📥 Migrating ${data.roles.length} roles...`);
      for (const role of data.roles) {
        await client.query(
          `INSERT INTO roles (code, name, system_role)
           VALUES ($1, $2, $3)
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, system_role = EXCLUDED.system_role`,
          [role.code, role.name, role.systemRole]
        );
      }
    }

    // 5. Populate Positions and Ranks
    if (Array.isArray(data.positions)) {
      console.log(`📥 Migrating ${data.positions.length} positions and ranks...`);
      for (const pos of data.positions) {
        await client.query(
          `INSERT INTO positions (code, name, department_id, role_code)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET
             name = EXCLUDED.name,
             department_id = EXCLUDED.department_id,
             role_code = EXCLUDED.role_code`,
          [
            pos.code,
            pos.name,
            pos.departmentId || null,
            pos.roleCode || null
          ]
        );

        if (Array.isArray(pos.ranks) && pos.ranks.length > 0) {
          for (let i = 0; i < pos.ranks.length; i++) {
            const rankName = pos.ranks[i];
            const rankId = `${pos.code}-${rankName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            try {
              await client.query(
                `INSERT INTO ranks (id, position_code, name, sort_order)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (id) DO UPDATE SET
                   name = EXCLUDED.name,
                   sort_order = EXCLUDED.sort_order`,
                [rankId, pos.code, rankName, i + 1]
              );
            } catch (err: any) {
              console.warn(`⚠️ Warning: Could not migrate rank "${rankName}" for position ${pos.code}:`, err.message);
            }
          }
        }
      }
    }

    // 6. Populate Employees
    if (data.employees && typeof data.employees === 'object') {
      const employeesList = Object.values(data.employees) as any[];
      console.log(`📥 Migrating ${employeesList.length} employees...`);
      for (const emp of employeesList) {
        await client.query(
          `INSERT INTO employees (id, email, name, role, status, created_at, password, profile)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name,
             role = EXCLUDED.role,
             status = EXCLUDED.status,
             created_at = EXCLUDED.created_at,
             password = EXCLUDED.password,
             profile = EXCLUDED.profile`,
          [
            emp.id,
            emp.email,
            emp.name,
            emp.role,
            emp.status || 'active',
            emp.createdAt || new Date().toISOString(),
            emp.password || 'password123',
            JSON.stringify(emp.profile || {})
          ]
        );
      }
    }

    // 7. Populate Emails
    if (Array.isArray(data.emails)) {
      console.log(`📥 Migrating ${data.emails.length} emails...`);
      for (const mail of data.emails) {
        await client.query(
          `INSERT INTO emails (id, to_email, subject, body, token, sent_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             to_email = EXCLUDED.to_email,
             subject = EXCLUDED.subject,
             body = EXCLUDED.body,
             token = EXCLUDED.token,
             sent_at = EXCLUDED.sent_at,
             status = EXCLUDED.status`,
          [
            mail.id,
            mail.to,
            mail.subject,
            mail.body || '',
            mail.token || '',
            mail.sentAt || new Date().toISOString(),
            mail.status || 'sent'
          ]
        );
      }
    }

    // 8. Populate Invitations
    if (data.invitations && typeof data.invitations === 'object') {
      const invList = Object.values(data.invitations) as any[];
      console.log(`📥 Migrating ${invList.length} invitations...`);
      for (const inv of invList) {
        await client.query(
          `INSERT INTO invitations (id, employee_id, email, token, status, sent_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             employee_id = EXCLUDED.employee_id,
             email = EXCLUDED.email,
             token = EXCLUDED.token,
             status = EXCLUDED.status,
             sent_at = EXCLUDED.sent_at,
             expires_at = EXCLUDED.expires_at`,
          [
            inv.id,
            inv.employeeId,
            inv.email,
            inv.token,
            inv.status || 'pending',
            inv.sentAt || new Date().toISOString(),
            inv.expiresAt || null
          ]
        );
      }
    }

    // 9. Populate Courses
    if (Array.isArray(data.courses)) {
      console.log(`📥 Migrating ${data.courses.length} courses...`);
      for (const course of data.courses) {
        await client.query(
          `INSERT INTO courses (id, title, description, position_code, position_name, rank, bindings, lessons, created_at, study_duration_days, exam_duration_days)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             position_code = EXCLUDED.position_code,
             position_name = EXCLUDED.position_name,
             rank = EXCLUDED.rank,
             bindings = EXCLUDED.bindings,
             lessons = EXCLUDED.lessons,
             created_at = EXCLUDED.created_at,
             study_duration_days = EXCLUDED.study_duration_days,
             exam_duration_days = EXCLUDED.exam_duration_days`,
          [
            course.id,
            course.title,
            course.description || '',
            course.positionCode || null,
            course.positionName || null,
            course.rank || null,
            JSON.stringify(course.bindings || []),
            JSON.stringify(course.lessons || []),
            course.createdAt || new Date().toISOString(),
            course.studyDurationDays || 7,
            course.examDurationDays || 3
          ]
        );
      }
    }

    // 10. Populate Lesson Grades
    if (Array.isArray(data.grades)) {
      console.log(`📥 Migrating ${data.grades.length} lesson grades...`);
      for (const grade of data.grades) {
        await client.query(
          `INSERT INTO lesson_grades (id, employee_id, course_id, lesson_id, score, comment, graded_by, graded_by_name, graded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             employee_id = EXCLUDED.employee_id,
             course_id = EXCLUDED.course_id,
             lesson_id = EXCLUDED.lesson_id,
             score = EXCLUDED.score,
             comment = EXCLUDED.comment,
             graded_by = EXCLUDED.graded_by,
             graded_by_name = EXCLUDED.graded_by_name,
             graded_at = EXCLUDED.graded_at`,
          [
            grade.id,
            grade.employeeId,
            grade.courseId,
            grade.lessonId,
            grade.score,
            grade.comment || '',
            grade.gradedBy || '',
            grade.gradedByName || '',
            grade.gradedAt || new Date().toISOString()
          ]
        );
      }
    }

    // 11. Populate Tickets
    if (Array.isArray(data.tickets)) {
      console.log(`📥 Migrating ${data.tickets.length} tickets...`);
      for (const ticket of data.tickets) {
        await client.query(
          `INSERT INTO tickets (
            id, channel, client, country, creator_type, requester_name, subject, description,
            status, created_at, resolved_at, closed_at, assigned_to_id, assigned_to_name,
            resolution_comment, closed_by_id, closed_by_name, system, module, type, action, kind,
            attachments, store_id, store_name, started_working_at, confirmed_at, confirmation_attachment
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
          ON CONFLICT (id) DO UPDATE SET
            channel = EXCLUDED.channel,
            client = EXCLUDED.client,
            country = EXCLUDED.country,
            creator_type = EXCLUDED.creator_type,
            requester_name = EXCLUDED.requester_name,
            subject = EXCLUDED.subject,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            created_at = EXCLUDED.created_at,
            resolved_at = EXCLUDED.resolved_at,
            closed_at = EXCLUDED.closed_at,
            assigned_to_id = EXCLUDED.assigned_to_id,
            assigned_to_name = EXCLUDED.assigned_to_name,
            resolution_comment = EXCLUDED.resolution_comment,
            closed_by_id = EXCLUDED.closed_by_id,
            closed_by_name = EXCLUDED.closed_by_name,
            system = EXCLUDED.system,
            module = EXCLUDED.module,
            type = EXCLUDED.type,
            action = EXCLUDED.action,
            kind = EXCLUDED.kind,
            attachments = EXCLUDED.attachments,
            store_id = EXCLUDED.store_id,
            store_name = EXCLUDED.store_name,
            started_working_at = EXCLUDED.started_working_at,
            confirmed_at = EXCLUDED.confirmed_at,
            confirmation_attachment = EXCLUDED.confirmation_attachment`,
          [
            ticket.id,
            ticket.channel,
            ticket.client,
            ticket.country,
            ticket.creatorType,
            ticket.requesterName,
            ticket.subject,
            ticket.description || '',
            ticket.status || 'open',
            ticket.createdAt || new Date().toISOString(),
            ticket.resolvedAt || null,
            ticket.closedAt || null,
            ticket.assignedToId || null,
            ticket.assignedToName || null,
            ticket.resolutionComment || null,
            ticket.closedById || null,
            ticket.closedByName || null,
            ticket.system || null,
            ticket.module || null,
            ticket.type || null,
            ticket.action || null,
            ticket.kind || null,
            JSON.stringify(ticket.attachments || []),
            ticket.storeId || null,
            ticket.storeName || null,
            ticket.startedWorkingAt || null,
            ticket.confirmedAt || null,
            ticket.confirmationAttachment ? JSON.stringify(ticket.confirmationAttachment) : null
          ]
        );
      }
    }

    // 12. Populate Support Channels
    if (Array.isArray(data.supportChannels)) {
      console.log(`📥 Migrating ${data.supportChannels.length} support channels...`);
      for (const ch of data.supportChannels) {
        await client.query(
          `INSERT INTO support_channels (id, code, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name`,
          [ch.id, ch.code, ch.name]
        );
      }
    }

    // 13. Populate Support Clients & Support Client Countries Junction Table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS support_client_countries (
            client_id VARCHAR(64) REFERENCES support_clients(id) ON DELETE CASCADE,
            country_id VARCHAR(64) REFERENCES support_countries(id) ON DELETE CASCADE,
            PRIMARY KEY (client_id, country_id)
        );
      `);
      await client.query(`ALTER TABLE support_clients DROP COLUMN IF EXISTS countries;`);
    } catch (err) {}

    if (Array.isArray(data.supportClients)) {
      console.log(`📥 Migrating ${data.supportClients.length} support clients & country links...`);
      for (const cl of data.supportClients) {
        await client.query(
          `INSERT INTO support_clients (id, name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [cl.id, cl.name]
        );

        try {
          await client.query(`DELETE FROM support_client_countries WHERE client_id = $1`, [cl.id]);
          for (const countryItem of cl.countries || []) {
            const matchedCountry = (data.supportCountries || []).find((c: any) => c.name === countryItem || c.code === countryItem || c.id === countryItem);
            if (matchedCountry) {
              await client.query(
                `INSERT INTO support_client_countries (client_id, country_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [cl.id, matchedCountry.id]
              );
            }
          }
        } catch (err) {}
      }
    }

    // 14. Populate Support Stores
    if (Array.isArray(data.supportStores)) {
      console.log(`📥 Migrating ${data.supportStores.length} support stores...`);
      for (const st of data.supportStores) {
        let countryId = st.countryId;
        if (!countryId && st.country) {
          const match = (data.supportCountries || []).find((c: any) => c.name === st.country || c.code === st.country);
          if (match) countryId = match.id;
        }
        await client.query(
          `INSERT INTO support_stores (id, name, client_id, country_id, country, code, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             client_id = EXCLUDED.client_id,
             country_id = EXCLUDED.country_id,
             country = EXCLUDED.country,
             code = EXCLUDED.code,
             status = EXCLUDED.status`,
          [st.id, st.name, st.clientId, countryId || null, st.country, st.code || null, st.status || 'active']
        );
      }

      // Auto-fill country_id for any existing stores in PostgreSQL where country_id is NULL
      try {
        await client.query(`
          UPDATE support_stores s
          SET country_id = c.id
          FROM support_countries c
          WHERE s.country_id IS NULL AND (s.country = c.name OR s.country = c.code);
        `);
      } catch (e) {
        // ignore
      }
    }

    // 15. Populate Support Kinds
    if (Array.isArray(data.supportKinds)) {
      console.log(`📥 Migrating ${data.supportKinds.length} support kinds...`);
      for (const k of data.supportKinds) {
        await client.query(
          `INSERT INTO support_kinds (id, name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [k.id, k.name]
        );
      }
    }

    // 16. Populate Support Countries
    if (Array.isArray(data.supportCountries)) {
      console.log(`📥 Migrating ${data.supportCountries.length} support countries...`);
      for (const sc of data.supportCountries) {
        await client.query(
          `INSERT INTO support_countries (id, code, name, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, status = EXCLUDED.status`,
          [sc.id, sc.code, sc.name, sc.status || 'active']
        );
      }
    }

    console.log('🎉 Data migration to PostgreSQL completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
