-- Tabla de profesionales
CREATE TABLE professionals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios de profesionales
CREATE TABLE professional_schedules (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL, -- 'Lunes', 'Martes', etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tratamientos
CREATE TABLE treatments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER, -- duración en minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de subtratamientos
CREATE TABLE subtreatments (
  id SERIAL PRIMARY KEY,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- duración en minutos
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de disponibilidad de tratamientos
CREATE TABLE treatment_availabilities (
  id SERIAL PRIMARY KEY,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  box VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  history TEXT,
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de turnos (appointments)
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE SET NULL,
  subtreatment_id INTEGER REFERENCES subtreatments(id) ON DELETE SET NULL,
  box VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'canceled'
  deposit DECIMAL(10, 2) DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métodos de pago
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  total DECIMAL(10, 2) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de venta
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- 'product' o 'treatment'
  item_id INTEGER NOT NULL, -- ID del producto o subtratamiento
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_treatment ON appointments(treatment_id);
CREATE INDEX idx_subtreatments_treatment ON subtreatments(treatment_id);
CREATE INDEX idx_treatment_availabilities_treatment ON treatment_availabilities(treatment_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_payments_sale ON payments(sale_id);

