-- Insertar profesionales
INSERT INTO professionals (name, specialty, email, phone, bio)
VALUES 
  ('Soledad Veron', 'Masajista', 'ana.garcia@example.com', '123-456-7890', 'Especialista en masajes terapéuticos con más de 5 años de experiencia.'),
  ('Sandra Veron', 'Esteticista', 'carlos.rodriguez@example.com', '234-567-8901', 'Especialista en tratamientos faciales y corporales.');

-- Insertar horarios de profesionales
INSERT INTO professional_schedules (professional_id, day_of_week, start_time, end_time)
VALUES
  (1, 'Lunes', '09:00', '18:00'),
  (1, 'Martes', '09:00', '18:00'),
  (1, 'Miércoles', '09:00', '18:00'),
  (1, 'Jueves', '09:00', '18:00'),
  (1, 'Viernes', '09:00', '18:00'),
  (2, 'Lunes', '13:00', '20:00'),
  (2, 'Martes', '13:00', '20:00'),
  (2, 'Miércoles', '13:00', '20:00'),
  (2, 'Jueves', '13:00', '20:00'),
  (2, 'Viernes', '13:00', '20:00');

-- Insertar tratamientos
INSERT INTO treatments (name, description, duration)
VALUES
  ('Masajes', 'Diferentes tipos de masajes terapéuticos y relajantes', 40),
  ('Faciales', 'Tratamientos para el cuidado de la piel del rostro', 45);

-- Insertar subtratamientos
INSERT INTO subtreatments (treatment_id, name, description, duration, price)
VALUES
  (1, 'Masaje Descontracturante', 'Alivia tensiones musculares', 40, 9000),
  (1, 'Masaje de Cuello', 'Enfocado en la zona cervical', 30, 7000),
  (1, 'Masaje de Piernas', 'Mejora la circulación', 35, 8000),
  (2, 'Limpieza Facial', 'Limpieza profunda de cutis', 45, 6000),
  (2, 'Hidratación Profunda', 'Hidratación intensiva para pieles secas', 50, 7500);

-- Insertar disponibilidad de tratamientos
INSERT INTO treatment_availabilities (treatment_id, start_date, end_date, start_time, end_time, box)
VALUES
  (1, '2023-04-01', '2023-12-31', '09:00', '18:00', 'Box 1'),
  (1, '2023-04-01', '2023-12-31', '09:00', '18:00', 'Box 2'),
  (2, '2023-04-01', '2023-12-31', '10:00', '17:00', 'Box 3'),
  (2, '2023-04-01', '2023-12-31', '10:00', '17:00', 'Box 4');

-- Insertar clientes
INSERT INTO clients (name, phone, email, history, last_visit)
VALUES
  ('María González', '123-456-7890', 'maria.gonzalez@example.com', 'Cliente regular. Prefiere masajes descontracturantes.', '2023-03-15'),
  ('Carlos Rodríguez', '234-567-8901', 'carlos.rodriguez@example.com', 'Primera visita el 10/02/2023. Tratamiento facial.', '2023-02-10'),
  ('Laura Martínez', '345-678-9012', 'laura.martinez@example.com', 'Tiene dolor crónico en la espalda. Masajes terapéuticos.', '2023-03-20'),
  ('Javier López', '456-789-0123', 'javier.lopez@example.com', 'Prefiere tratamientos por la tarde.', '2023-03-05'),
  ('Ana Sánchez', '567-890-1234', 'ana.sanchez@example.com', 'Alérgica a algunos aceites esenciales.', '2023-03-18');

-- Insertar productos
INSERT INTO products (name, description, price, stock)
VALUES
  ('Aceite de Masaje Relajante', 'Aceite esencial para masajes relajantes', 2500, 15),
  ('Crema Hidratante Facial', 'Crema hidratante para todo tipo de piel', 3200, 8),
  ('Exfoliante Corporal', 'Exfoliante natural para una piel suave', 2800, 12),
  ('Mascarilla Facial de Arcilla', 'Mascarilla purificante para pieles grasas', 1800, 20),
  ('Sérum Antiarrugas', 'Sérum concentrado para reducir líneas de expresión', 4500, 5);

-- Insertar métodos de pago
INSERT INTO payment_methods (name, description)
VALUES
  ('Efectivo', 'Pago en efectivo'),
  ('Transferencia', 'Transferencia bancaria'),
  ('Tarjeta de Crédito', 'Pago con tarjeta de crédito'),
  ('Tarjeta de Débito', 'Pago con tarjeta de débito');

