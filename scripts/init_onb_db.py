#!/usr/bin/env python3
"""
Python Script to initialize PostgreSQL database named 'onb'
and populate it with data from database.json (or default project data).
"""

import os
import sys
import json
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database Configuration (Environment variables with defaults)
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_USER = os.getenv("POSTGRES_USER", "talgat")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "talgat")
TARGET_DB = os.getenv("POSTGRES_DB", "onb")  # Specified database name: onb

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
SCHEMA_FILE = os.path.join(SCRIPT_DIR, "schema.sql")
DATA_FILE = os.path.join(PROJECT_DIR, "database.json")


def ensure_database_exists():
    """Connects to default 'postgres' database and creates 'onb' if it doesn't exist."""
    print(f"🔍 Checking if database '{TARGET_DB}' exists on {DB_HOST}:{DB_PORT}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (TARGET_DB,))
        exists = cursor.fetchone()

        if not exists:
            print(f"✨ Creating database '{TARGET_DB}'...")
            cursor.execute(f'CREATE DATABASE "{TARGET_DB}";')
            print(f"✅ Database '{TARGET_DB}' created successfully.")
        else:
            print(f"ℹ️ Database '{TARGET_DB}' already exists.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"⚠️ Warning during database creation check: {e}")


def apply_schema(cursor):
    """Applies DDL schema to create tables."""
    print(f"📜 Applying DDL schema to '{TARGET_DB}'...")
    if os.path.exists(SCHEMA_FILE):
        with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        cursor.execute(schema_sql)
        print("✅ Schema tables applied successfully.")
    else:
        print(f"❌ Schema file not found: {SCHEMA_FILE}")
        sys.exit(1)


def load_project_data():
    """Loads project data from database.json."""
    if not os.path.exists(DATA_FILE):
        print(f"❌ Data file database.json not found at {DATA_FILE}")
        sys.exit(1)
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def populate_data(cursor, data):
    """Populates PostgreSQL tables with data from database.json."""
    print(f"📥 Populating '{TARGET_DB}' database with project data...")

    # 1. Departments
    departments = data.get("departments", [])
    print(f"  -> Migrating {len(departments)} departments...")
    for dept in departments:
        cursor.execute(
            """
            INSERT INTO departments (id, name)
            VALUES (%s, %s)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
            """,
            (dept["id"], dept["name"])
        )

    # 2. Roles
    roles = data.get("roles", [])
    print(f"  -> Migrating {len(roles)} roles...")
    for r in roles:
        cursor.execute(
            """
            INSERT INTO roles (code, name, system_role)
            VALUES (%s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, system_role = EXCLUDED.system_role;
            """,
            (r["code"], r["name"], r.get("systemRole", "employee"))
        )

    # 3. Positions & Ranks
    positions = data.get("positions", [])
    print(f"  -> Migrating {len(positions)} positions and ranks...")
    for p in positions:
        cursor.execute(
            """
            INSERT INTO positions (code, name, department_id, role_code)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                department_id = EXCLUDED.department_id,
                role_code = EXCLUDED.role_code;
            """,
            (
                p["code"],
                p["name"],
                p.get("departmentId"),
                p.get("roleCode")
            )
        )

        ranks = p.get("ranks", [])
        if isinstance(ranks, list):
            for idx, r_name in enumerate(ranks):
                r_id = f"{p['code']}-{r_name.lower().replace(' ', '-')}"
                cursor.execute(
                    """
                    INSERT INTO ranks (id, position_code, name, sort_order)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        sort_order = EXCLUDED.sort_order;
                    """,
                    (r_id, p["code"], r_name, idx + 1)
                )

    # 4. Employees
    employees = data.get("employees", {})
    emp_list = list(employees.values()) if isinstance(employees, dict) else employees
    print(f"  -> Migrating {len(emp_list)} employees...")
    for emp in emp_list:
        cursor.execute(
            """
            INSERT INTO employees (id, email, name, role, status, created_at, password, profile)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                status = EXCLUDED.status,
                created_at = EXCLUDED.created_at,
                password = EXCLUDED.password,
                profile = EXCLUDED.profile;
            """,
            (
                emp["id"],
                emp["email"],
                emp["name"],
                emp["role"],
                emp.get("status", "active"),
                emp.get("createdAt"),
                emp.get("password", "password123"),
                json.dumps(emp.get("profile", {}))
            )
        )

    # 5. Emails
    emails = data.get("emails", [])
    print(f"  -> Migrating {len(emails)} emails...")
    for mail in emails:
        cursor.execute(
            """
            INSERT INTO emails (id, to_email, subject, body, token, sent_at, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                to_email = EXCLUDED.to_email,
                subject = EXCLUDED.subject,
                body = EXCLUDED.body,
                token = EXCLUDED.token,
                sent_at = EXCLUDED.sent_at,
                status = EXCLUDED.status;
            """,
            (
                mail["id"],
                mail.get("to", ""),
                mail.get("subject", ""),
                mail.get("body", ""),
                mail.get("token", ""),
                mail.get("sentAt"),
                mail.get("status", "sent")
            )
        )

    # 6. Invitations
    invitations = data.get("invitations", {})
    inv_list = list(invitations.values()) if isinstance(invitations, dict) else invitations
    print(f"  -> Migrating {len(inv_list)} invitations...")
    for inv in inv_list:
        cursor.execute(
            """
            INSERT INTO invitations (id, employee_id, email, token, status, sent_at, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                employee_id = EXCLUDED.employee_id,
                email = EXCLUDED.email,
                token = EXCLUDED.token,
                status = EXCLUDED.status,
                sent_at = EXCLUDED.sent_at,
                expires_at = EXCLUDED.expires_at;
            """,
            (
                inv["id"],
                inv.get("employeeId"),
                inv.get("email"),
                inv.get("token"),
                inv.get("status", "pending"),
                inv.get("sentAt"),
                inv.get("expiresAt")
            )
        )

    # 7. Courses
    courses = data.get("courses", [])
    print(f"  -> Migrating {len(courses)} courses...")
    for c in courses:
        cursor.execute(
            """
            INSERT INTO courses (id, title, description, position_code, position_name, rank, bindings, lessons, created_at, study_duration_days, exam_duration_days)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                exam_duration_days = EXCLUDED.exam_duration_days;
            """,
            (
                c["id"],
                c.get("title"),
                c.get("description", ""),
                c.get("positionCode"),
                c.get("positionName"),
                c.get("rank"),
                json.dumps(c.get("bindings", [])),
                json.dumps(c.get("lessons", [])),
                c.get("createdAt"),
                c.get("studyDurationDays", 7),
                c.get("examDurationDays", 3)
            )
        )

    # 8. Lesson Grades
    grades = data.get("grades", [])
    print(f"  -> Migrating {len(grades)} grades...")
    for g in grades:
        cursor.execute(
            """
            INSERT INTO lesson_grades (id, employee_id, course_id, lesson_id, score, comment, graded_by, graded_by_name, graded_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                employee_id = EXCLUDED.employee_id,
                course_id = EXCLUDED.course_id,
                lesson_id = EXCLUDED.lesson_id,
                score = EXCLUDED.score,
                comment = EXCLUDED.comment,
                graded_by = EXCLUDED.graded_by,
                graded_by_name = EXCLUDED.graded_by_name,
                graded_at = EXCLUDED.graded_at;
            """,
            (
                g["id"],
                g.get("employeeId"),
                g.get("courseId"),
                g.get("lessonId"),
                g.get("score"),
                g.get("comment", ""),
                g.get("gradedBy", ""),
                g.get("gradedByName", ""),
                g.get("gradedAt")
            )
        )

    # 9. Tickets
    tickets = data.get("tickets", [])
    print(f"  -> Migrating {len(tickets)} tickets...")
    for t in tickets:
        cursor.execute(
            """
            INSERT INTO tickets (
                id, channel, client, country, creator_type, requester_name, subject, description,
                status, created_at, resolved_at, closed_at, assigned_to_id, assigned_to_name,
                resolution_comment, closed_by_id, closed_by_name, system, module, type, action, kind,
                attachments, store_id, store_name, started_working_at, confirmed_at, confirmation_attachment
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                resolved_at = EXCLUDED.resolved_at,
                closed_at = EXCLUDED.closed_at,
                assigned_to_id = EXCLUDED.assigned_to_id,
                assigned_to_name = EXCLUDED.assigned_to_name,
                resolution_comment = EXCLUDED.resolution_comment,
                closed_by_id = EXCLUDED.closed_by_id,
                closed_by_name = EXCLUDED.closed_by_name,
                started_working_at = EXCLUDED.started_working_at,
                confirmed_at = EXCLUDED.confirmed_at,
                confirmation_attachment = EXCLUDED.confirmation_attachment;
            """,
            (
                t["id"],
                t.get("channel"),
                t.get("client"),
                t.get("country"),
                t.get("creatorType"),
                t.get("requesterName"),
                t.get("subject"),
                t.get("description", ""),
                t.get("status", "open"),
                t.get("createdAt"),
                t.get("resolvedAt"),
                t.get("closedAt"),
                t.get("assignedToId"),
                t.get("assignedToName"),
                t.get("resolutionComment"),
                t.get("closedById"),
                t.get("closedByName"),
                t.get("system"),
                t.get("module"),
                t.get("type"),
                t.get("action"),
                t.get("kind"),
                json.dumps(t.get("attachments", [])),
                t.get("storeId"),
                t.get("storeName"),
                t.get("startedWorkingAt"),
                t.get("confirmedAt"),
                json.dumps(t["confirmationAttachment"]) if t.get("confirmationAttachment") else None
            )
        )

    # 10. Support Channels
    channels = data.get("supportChannels", [])
    print(f"  -> Migrating {len(channels)} support channels...")
    for ch in channels:
        cursor.execute(
            """
            INSERT INTO support_channels (id, code, name)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;
            """,
            (ch["id"], ch["code"], ch["name"])
        )

    # 11. Support Clients
    clients = data.get("supportClients", [])
    print(f"  -> Migrating {len(clients)} support clients...")
    for cl in clients:
        cursor.execute(
            """
            INSERT INTO support_clients (id, name, countries)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, countries = EXCLUDED.countries;
            """,
            (cl["id"], cl["name"], json.dumps(cl.get("countries", [])))
        )

    # 12. Support Stores
    stores = data.get("supportStores", [])
    print(f"  -> Migrating {len(stores)} support stores...")
    for st in stores:
        cursor.execute(
            """
            INSERT INTO support_stores (id, name, client_id, country_id, country, code, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                client_id = EXCLUDED.client_id,
                country_id = EXCLUDED.country_id,
                country = EXCLUDED.country,
                code = EXCLUDED.code,
                status = EXCLUDED.status;
            """,
            (st["id"], st["name"], st.get("clientId"), st.get("countryId"), st.get("country"), st.get("code"), st.get("status", "active"))
        )

    # 13. Support Kinds
    kinds = data.get("supportKinds", [])
    print(f"  -> Migrating {len(kinds)} support kinds...")
    for k in kinds:
        cursor.execute(
            """
            INSERT INTO support_kinds (id, name)
            VALUES (%s, %s)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
            """,
            (k["id"], k["name"])
        )

    # 14. Support Countries
    scountries = data.get("supportCountries", [])
    print(f"  -> Migrating {len(scountries)} support countries...")
    for sc in scountries:
        cursor.execute(
            """
            INSERT INTO support_countries (id, code, name, status)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, status = EXCLUDED.status;
            """,
            (sc["id"], sc["code"], sc["name"], sc.get("status", "active"))
        )


def main():
    print(f"🚀 Starting Python PostgreSQL setup for database '{TARGET_DB}'...")
    
    # 1. Ensure target DB exists
    ensure_database_exists()

    # 2. Connect to target DB and apply schema & data
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            dbname=TARGET_DB
        )
        conn.autocommit = False
        cursor = conn.cursor()

        # Apply schema
        apply_schema(cursor)

        # Load data
        data = load_project_data()

        # Populate tables
        populate_data(cursor, data)

        conn.commit()
        print(f"🎉 Successfully created and populated database '{TARGET_DB}' with project data!")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error initializing database '{TARGET_DB}': {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
