-- =================================================================
-- Schema DDL for Support Team Learning Platform (PostgreSQL)
-- =================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    system_role VARCHAR(64) NOT NULL
);

-- 3. Positions Table
CREATE TABLE IF NOT EXISTS positions (
    code VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id VARCHAR(10) REFERENCES departments(id) ON DELETE SET NULL,
    role_code VARCHAR(64) REFERENCES roles(code) ON DELETE SET NULL,
    ranks JSONB DEFAULT '[]'::jsonb
);

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    password VARCHAR(255) NOT NULL DEFAULT 'password123',
    profile JSONB DEFAULT '{}'::jsonb
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
    name VARCHAR(255) NOT NULL,
    countries JSONB DEFAULT '[]'::jsonb
);

-- 12. Support Stores Table
CREATE TABLE IF NOT EXISTS support_stores (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(64) REFERENCES support_clients(id) ON DELETE CASCADE,
    country VARCHAR(255) NOT NULL,
    code VARCHAR(64),
    status VARCHAR(64) DEFAULT 'active'
);

-- 13. Support Kinds Table
CREATE TABLE IF NOT EXISTS support_kinds (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
