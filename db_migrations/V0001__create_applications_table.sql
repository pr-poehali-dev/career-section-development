CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('student', 'applicant')),
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    position VARCHAR(255),
    experience INTEGER,
    cover_letter TEXT,
    portfolio_url TEXT,
    
    university VARCHAR(255),
    course INTEGER,
    specialty VARCHAR(255),
    direction VARCHAR(255),
    motivation_letter TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_type ON applications(application_type);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
