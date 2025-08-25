/*
  # Sistema de Rifas - Esquema Completo

  1. Nuevas Tablas
    - `raffle_settings`
      - `id` (uuid, primary key)
      - `raffle_name` (text)
      - `prize_name` (text)
      - `prize_value` (text)
      - `ticket_price` (integer)
      - `prize_image_url` (text, opcional)
      - `lottery_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tickets`
      - `id` (uuid, primary key)
      - `number` (text, unique)
      - `status` (enum: available, pending, sold)
      - `owner_name` (text, opcional)
      - `owner_whatsapp` (text, opcional)
      - `reservation_timestamp` (timestamp, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para lectura pública
    - Políticas para escritura autenticada (admin)
*/

-- Crear enum para estados de tickets
CREATE TYPE ticket_status AS ENUM ('available', 'pending', 'sold');

-- Tabla de configuración de la rifa
CREATE TABLE IF NOT EXISTS raffle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_name text NOT NULL DEFAULT 'Gran Rifa SAMMY',
  prize_name text NOT NULL DEFAULT 'Premio Especial',
  prize_value text NOT NULL DEFAULT '$5,000,000',
  ticket_price integer NOT NULL DEFAULT 20000,
  prize_image_url text,
  lottery_name text NOT NULL DEFAULT 'Sinuano Noche',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  status ticket_status NOT NULL DEFAULT 'available',
  owner_name text,
  owner_whatsapp text,
  reservation_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE raffle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para raffle_settings
CREATE POLICY "Todos pueden leer configuración de rifa"
  ON raffle_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Solo administradores pueden modificar configuración"
  ON raffle_settings
  FOR ALL
  TO authenticated
  USING (true);

-- Políticas para tickets
CREATE POLICY "Todos pueden leer tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Todos pueden crear reservas de tickets"
  ON tickets
  FOR INSERT
  TO public
  WITH CHECK (status = 'pending');

CREATE POLICY "Todos pueden actualizar tickets disponibles a pendientes"
  ON tickets
  FOR UPDATE
  TO public
  USING (status = 'available')
  WITH CHECK (status = 'pending');

CREATE POLICY "Solo administradores pueden gestionar todos los tickets"
  ON tickets
  FOR ALL
  TO authenticated
  USING (true);

-- Insertar configuración inicial
INSERT INTO raffle_settings (raffle_name, prize_name, prize_value, ticket_price, lottery_name)
VALUES ('Gran Rifa SAMMY', 'Premio Especial', '$5,000,000', 20000, 'Sinuano Noche')
ON CONFLICT DO NOTHING;

-- Insertar tickets del 00 al 99
INSERT INTO tickets (number, status)
SELECT 
  LPAD(generate_series(0, 99)::text, 2, '0'),
  'available'
ON CONFLICT (number) DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_raffle_settings_updated_at
  BEFORE UPDATE ON raffle_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();