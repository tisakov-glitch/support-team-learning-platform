-- =================================================================
-- Schema DDL for Support Team Learning Platform (PostgreSQL)
-- =================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);
INSERT INTO departments (id, name) VALUES ('dept-5', 'RetMind Support') ON CONFLICT (id) DO NOTHING;

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    system_role VARCHAR(64) NOT NULL
);
INSERT INTO roles (code, name, system_role) VALUES 
  ('employee', 'Employee', 'employee'),
  ('manager', 'Manager', 'manager'),
  ('admin', 'Admin', 'admin')
ON CONFLICT (code) DO NOTHING;

-- 3. Positions Table
CREATE TABLE IF NOT EXISTS positions (
    code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id VARCHAR(10) REFERENCES departments(id) ON DELETE SET NULL,
    role_code VARCHAR(64) REFERENCES roles(code) ON DELETE SET NULL
);
INSERT INTO positions (code, name, department_id, role_code) VALUES 
  ('12', 'Support Shift Manager', 'dept-5', 'employee')
ON CONFLICT (code) DO NOTHING;

-- 4. Ranks Table
CREATE TABLE IF NOT EXISTS ranks (
    id VARCHAR(64) PRIMARY KEY,
    position_code VARCHAR(64) REFERENCES positions(code) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE ranks ALTER COLUMN position_code DROP NOT NULL;
GRANT ALL ON TABLE ranks TO PUBLIC;

INSERT INTO ranks (id, position_code, name, sort_order)
VALUES 
  ('12-shift-manager-l1', '12', 'Shift Manager L1', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. Employees Table (Normalized)
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL DEFAULT '',
    last_name VARCHAR(255) NOT NULL DEFAULT '',
    role VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL DEFAULT 'password123',
    phone VARCHAR(64),
    department_id VARCHAR(10) REFERENCES departments(id) ON DELETE SET NULL,
    position_code VARCHAR(64) REFERENCES positions(code) ON DELETE SET NULL,
    rank_id VARCHAR(64) REFERENCES ranks(id) ON DELETE SET NULL,
    course_started_dates JSONB DEFAULT '{}'::jsonb
);

-- 5. Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id VARCHAR(64) PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    body TEXT,
    token VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(64) NOT NULL DEFAULT 'sent'
);

-- 6. Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES employees(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 7. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(512) NOT NULL,
    description TEXT,
    position_code VARCHAR(64),
    position_name VARCHAR(255),
    rank VARCHAR(255),
    bindings JSONB DEFAULT '[]'::jsonb,
    lessons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    study_duration_days INT DEFAULT 7,
    exam_duration_days INT DEFAULT 3
);

-- 8. Lesson Grades Table
CREATE TABLE IF NOT EXISTS lesson_grades (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) REFERENCES employees(id) ON DELETE CASCADE,
    course_id VARCHAR(64) REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id VARCHAR(64) NOT NULL,
    score INT NOT NULL,
    comment TEXT,
    graded_by VARCHAR(64),
    graded_by_name VARCHAR(255),
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    channel VARCHAR(64) NOT NULL,
    client VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    creator_type VARCHAR(64) NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    description TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    assigned_to_id VARCHAR(64) REFERENCES employees(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(255),
    resolution_comment TEXT,
    closed_by_id VARCHAR(64) REFERENCES employees(id) ON DELETE SET NULL,
    closed_by_name VARCHAR(255),
    system VARCHAR(255),
    module VARCHAR(255),
    type VARCHAR(255),
    action VARCHAR(255),
    kind VARCHAR(255),
    attachments JSONB DEFAULT '[]'::jsonb,
    store_id VARCHAR(64),
    store_name VARCHAR(255),
    started_working_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmation_attachment JSONB
);

-- 10. Support Channels Table
CREATE TABLE IF NOT EXISTS support_channels (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- 11. Support Clients Table
CREATE TABLE IF NOT EXISTS support_clients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 12. Support Countries Table
CREATE TABLE IF NOT EXISTS support_countries (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Support Client Countries Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS support_client_countries (
    client_id VARCHAR(64) REFERENCES support_clients(id) ON DELETE CASCADE,
    country_id VARCHAR(64) REFERENCES support_countries(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, country_id)
);

-- 13. Support Stores Table
CREATE TABLE IF NOT EXISTS support_stores (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(64) REFERENCES support_clients(id) ON DELETE CASCADE,
    country_id VARCHAR(64) REFERENCES support_countries(id) ON DELETE SET NULL,
    country VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    status VARCHAR(64) DEFAULT 'active'
);

-- 14. Support Kinds Table
CREATE TABLE IF NOT EXISTS support_kinds (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 15. Ticket Category Systems Table
CREATE TABLE IF NOT EXISTS ticket_category_systems (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Ticket Category Modules Table
CREATE TABLE IF NOT EXISTS ticket_category_modules (
    id VARCHAR(64) PRIMARY KEY,
    system_id VARCHAR(64) REFERENCES ticket_category_systems(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_system_module_name UNIQUE (system_id, name)
);

-- 17. Ticket Category Types Table
CREATE TABLE IF NOT EXISTS ticket_category_types (
    id VARCHAR(64) PRIMARY KEY,
    module_id VARCHAR(64) REFERENCES ticket_category_modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_module_type_name UNIQUE (module_id, name)
);

-- 18. Ticket Category Actions Table
CREATE TABLE IF NOT EXISTS ticket_category_actions (
    id VARCHAR(64) PRIMARY KEY,
    type_id VARCHAR(64) REFERENCES ticket_category_types(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_type_action_name UNIQUE (type_id, name)
);

-- Grant privileges table-by-table to avoid permission error on individually owned tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE 'GRANT ALL PRIVILEGES ON TABLE ' || quote_ident(r.tablename) || ' TO PUBLIC';
        EXCEPTION WHEN OTHERS THEN END;
    END LOOP;
END $$;
