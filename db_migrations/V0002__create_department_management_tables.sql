-- Создание таблицы групп
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    hired_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы задач
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    employee_id INTEGER REFERENCES employees(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Вставка тестовых данных
INSERT INTO groups (name, description) VALUES 
    ('Группа A', 'Первая группа отдела'),
    ('Группа B', 'Вторая группа отдела');

INSERT INTO employees (group_id, name, position, email, status) VALUES 
    (1, 'Иван Петров', 'Руководитель группы', 'ivan@example.com', 'active'),
    (1, 'Мария Сидорова', 'Специалист', 'maria@example.com', 'active'),
    (2, 'Алексей Смирнов', 'Руководитель группы', 'alexey@example.com', 'active'),
    (2, 'Елена Козлова', 'Специалист', 'elena@example.com', 'active');

INSERT INTO tasks (group_id, employee_id, title, status, priority) VALUES 
    (1, 1, 'Подготовить отчёт', 'in_progress', 'high'),
    (1, 2, 'Провести анализ данных', 'todo', 'medium'),
    (2, 3, 'Организовать встречу', 'completed', 'low'),
    (2, 4, 'Обновить документацию', 'todo', 'high');