-- scripts/data_warehouse.sql

-- =============================================
-- Data Warehouse Schema
-- =============================================

-- Fact Table: Job Applications
CREATE TABLE IF NOT EXISTS fact_job_applications (
    application_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    job_id INTEGER REFERENCES jobs(id),
    application_date DATE,
    status VARCHAR(50),
    match_score DECIMAL(5,2),
    response_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact Table: Resume Analytics
CREATE TABLE IF NOT EXISTS fact_resume_analytics (
    resume_id INTEGER REFERENCES resumes(id),
    student_id INTEGER REFERENCES users(id),
    skills_count INTEGER,
    experience_years INTEGER,
    education_level VARCHAR(50),
    employability_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fact Table: User Activity
CREATE TABLE IF NOT EXISTS fact_user_activity (
    activity_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50),
    activity_date DATE,
    duration INTEGER,
    page VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension Table: Students
CREATE TABLE IF NOT EXISTS dim_students (
    student_id INTEGER PRIMARY KEY REFERENCES users(id),
    department VARCHAR(50),
    year_of_study INTEGER,
    cgpa DECIMAL(3,2),
    skills_count INTEGER,
    internship_months INTEGER,
    projects_count INTEGER,
    certifications_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension Table: Jobs
CREATE TABLE IF NOT EXISTS dim_jobs (
    job_id INTEGER PRIMARY KEY REFERENCES jobs(id),
    title VARCHAR(200),
    company VARCHAR(100),
    domain VARCHAR(50),
    job_type VARCHAR(50),
    location VARCHAR(100),
    experience_required INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension Table: Time
CREATE TABLE IF NOT EXISTS dim_time (
    date_id INTEGER PRIMARY KEY,
    full_date DATE,
    year INTEGER,
    quarter INTEGER,
    month INTEGER,
    month_name VARCHAR(20),
    week_number INTEGER,
    day_of_week INTEGER,
    day_name VARCHAR(20),
    is_weekend BOOLEAN
);

-- =============================================
-- Materialized Views for Analytics
-- =============================================

-- Student Performance Dashboard
CREATE MATERIALIZED VIEW mv_student_performance AS
SELECT 
    d.department,
    d.year_of_study,
    AVG(f.employability_score) AS avg_employability,
    COUNT(f.resume_id) AS total_resumes,
    AVG(d.cgpa) AS avg_cgpa,
    AVG(d.skills_count) AS avg_skills
FROM fact_resume_analytics f
JOIN dim_students d ON f.student_id = d.student_id
GROUP BY d.department, d.year_of_study;

-- Job Market Trends
CREATE MATERIALIZED VIEW mv_job_market_trends AS
SELECT 
    j.domain,
    j.job_type,
    j.location,
    COUNT(f.application_id) AS total_applications,
    AVG(f.match_score) AS avg_match_score,
    AVG(j.experience_required) AS avg_experience
FROM fact_job_applications f
JOIN dim_jobs j ON f.job_id = j.job_id
GROUP BY j.domain, j.job_type, j.location;

-- User Engagement Analytics
CREATE MATERIALIZED VIEW mv_user_engagement AS
SELECT 
    u.user_id,
    u.department,
    u.year_of_study,
    COUNT(a.activity_id) AS total_activities,
    AVG(a.duration) AS avg_session_duration,
    COUNT(DISTINCT a.page) AS unique_pages
FROM dim_students u
LEFT JOIN fact_user_activity a ON u.student_id = a.user_id
GROUP BY u.user_id, u.department, u.year_of_study;