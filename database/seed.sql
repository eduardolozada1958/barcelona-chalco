-- ============================================================
-- ACADEMIA FÚTBOL BARCELONA
-- SEED DATA - Datos iniciales de prueba
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ============================================================
-- CONFIGURACIÓN DEL CLUB
-- ============================================================
INSERT INTO club_settings (
  id,
  club_name,
  club_description,
  season,
  primary_color,
  secondary_color,
  accent_color,
  contact_email,
  contact_phone,
  contact_address,
  website_url,
  instagram_url
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Academia FC Barcelona Monterrey',
  'Academia de fútbol de alto rendimiento formando los talentos del futuro. Disciplina, técnica y pasión por el deporte.',
  '2024-2025',
  '#D4AF37',
  '#1A1A2E',
  '#0F3460',
  'academia@barcelonamty.com',
  '+52 81 1234 5678',
  'Av. Lázaro Cárdenas 2400, San Pedro Garza García, N.L.',
  'https://barcelonamty.com',
  'https://instagram.com/academiabarcelonamty'
);

-- ============================================================
-- USUARIOS DEL SISTEMA
-- Contraseñas: todas son "Password123!" en bcrypt
-- Hash generado con bcrypt rounds=12
-- ============================================================

-- Admin principal
INSERT INTO users (
  id, email, password_hash, role, status,
  full_name, phone, email_verified
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'admin@barcelonamty.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
  'admin',
  'active',
  'Carlos Rodríguez Martínez',
  '+52 81 9876 5432',
  TRUE
);

-- Entrenador principal
INSERT INTO users (
  id, email, password_hash, role, status,
  full_name, phone, email_verified
) VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'entrenador@barcelonamty.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
  'coach',
  'active',
  'Miguel Ángel Torres Herrera',
  '+52 81 8765 4321',
  TRUE
);

-- Entrenador auxiliar
INSERT INTO users (
  id, email, password_hash, role, status,
  full_name, phone, email_verified
) VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'coach2@barcelonamty.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
  'coach',
  'active',
  'Roberto Sánchez López',
  '+52 81 7654 3210',
  TRUE
);

-- Padres de familia
INSERT INTO users (id, email, password_hash, role, status, full_name, phone, email_verified)
VALUES
  ('b0000000-0000-0000-0000-000000000010',
   'padre1@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'Alejandro García Morales', '+52 81 1111 2222', TRUE),

  ('b0000000-0000-0000-0000-000000000011',
   'padre2@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'Fernando López Jiménez', '+52 81 2222 3333', TRUE),

  ('b0000000-0000-0000-0000-000000000012',
   'madre1@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'Ana Patricia Martínez Vega', '+52 81 3333 4444', TRUE),

  ('b0000000-0000-0000-0000-000000000013',
   'padre3@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'José Luis Hernández Cruz', '+52 81 4444 5555', TRUE),

  ('b0000000-0000-0000-0000-000000000014',
   'padre4@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'María Elena Ramírez Soto', '+52 81 5555 6666', TRUE),

  ('b0000000-0000-0000-0000-000000000015',
   'padre5@email.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewbp3mTzGm6p3.lm',
   'parent', 'active', 'David Flores Castillo', '+52 81 6666 7777', TRUE);

-- ============================================================
-- PERFILES DE PADRES
-- ============================================================
INSERT INTO parents (id, user_id, first_name, last_name, phone_primary, relationship)
VALUES
  ('c0000000-0000-0000-0000-000000000010',
   'b0000000-0000-0000-0000-000000000010',
   'Alejandro', 'García Morales', '+52 81 1111 2222', 'padre'),

  ('c0000000-0000-0000-0000-000000000011',
   'b0000000-0000-0000-0000-000000000011',
   'Fernando', 'López Jiménez', '+52 81 2222 3333', 'padre'),

  ('c0000000-0000-0000-0000-000000000012',
   'b0000000-0000-0000-0000-000000000012',
   'Ana Patricia', 'Martínez Vega', '+52 81 3333 4444', 'madre'),

  ('c0000000-0000-0000-0000-000000000013',
   'b0000000-0000-0000-0000-000000000013',
   'José Luis', 'Hernández Cruz', '+52 81 4444 5555', 'padre'),

  ('c0000000-0000-0000-0000-000000000014',
   'b0000000-0000-0000-0000-000000000014',
   'María Elena', 'Ramírez Soto', '+52 81 5555 6666', 'madre'),

  ('c0000000-0000-0000-0000-000000000015',
   'b0000000-0000-0000-0000-000000000015',
   'David', 'Flores Castillo', '+52 81 6666 7777', 'padre');

-- ============================================================
-- JUGADORES
-- ============================================================
INSERT INTO players (
  id, first_name, last_name, birth_date, nationality,
  position, secondary_position, jersey_number,
  dominant_foot, height_cm, weight_kg,
  category, sport_description,
  status, is_verified, verified_at, verified_by,
  qr_token, qr_generated_at, season, achievements
) VALUES
  -- Categoría Sub-17
  ('d0000000-0000-0000-0000-000000000001',
   'Lucas', 'García Torres', '2008-03-15', 'Mexicana',
   'Delantero Centro', 'Extremo Derecho', 9,
   'right', 175, 68,
   'Sub-17',
   'Delantero explosivo con gran capacidad de definición. Destacado por su velocidad y habilidad en uno contra uno.',
   'active', TRUE, NOW() - INTERVAL '30 days', 'b0000000-0000-0000-0000-000000000001',
   'qr_lucas_garcia_2024_a1b2c3d4e5f6g7h8',
   NOW() - INTERVAL '30 days',
   '2024-2025',
   'Goleador del torneo sub-17 regional 2023. Convocado a la selección estatal 2024.'),

  ('d0000000-0000-0000-0000-000000000002',
   'Diego', 'López Martínez', '2007-07-22', 'Mexicana',
   'Mediocampista Central', 'Mediocampista Ofensivo', 8,
   'right', 172, 65,
   'Sub-17',
   'Mediocampista con gran visión de juego y capacidad de distribución. Motor del equipo en el mediocampo.',
   'active', TRUE, NOW() - INTERVAL '25 days', 'b0000000-0000-0000-0000-000000000001',
   'qr_diego_lopez_2024_b2c3d4e5f6g7h8i9',
   NOW() - INTERVAL '25 days',
   '2024-2025',
   'Mejor mediocampista del torneo regional 2023.'),

  ('d0000000-0000-0000-0000-000000000003',
   'Sebastián', 'Hernández Ruiz', '2008-11-05', 'Mexicana',
   'Portero', NULL, 1,
   'right', 180, 75,
   'Sub-17',
   'Portero con reflejos excepcionales y liderazgo natural. Excelente en el juego aéreo y salidas.',
   'active', TRUE, NOW() - INTERVAL '20 days', 'b0000000-0000-0000-0000-000000000002',
   'qr_sebastian_hernandez_2024_c3d4e5f6',
   NOW() - INTERVAL '20 days',
   '2024-2025',
   NULL),

  ('d0000000-0000-0000-0000-000000000004',
   'Mateo', 'Ramírez González', '2007-05-18', 'Mexicana',
   'Defensa Central', 'Lateral Derecho', 5,
   'right', 178, 73,
   'Sub-17',
   'Defensa central con gran juego aéreo y excelente lectura del juego. Capitán del equipo.',
   'active', TRUE, NOW() - INTERVAL '28 days', 'b0000000-0000-0000-0000-000000000001',
   'qr_mateo_ramirez_2024_d4e5f6g7h8i9j0',
   NOW() - INTERVAL '28 days',
   '2024-2025',
   'Capitán del equipo Sub-17. Premio al mejor defensa del torneo 2023.'),

  ('d0000000-0000-0000-0000-000000000005',
   'Emiliano', 'Flores Soto', '2008-09-30', 'Mexicana',
   'Extremo Izquierdo', 'Extremo Derecho', 11,
   'left', 168, 62,
   'Sub-17',
   'Extremo zurdo veloz con gran capacidad de desborde. Especialista en asistencias de gol.',
   'active', TRUE, NOW() - INTERVAL '15 days', 'b0000000-0000-0000-0000-000000000002',
   'qr_emiliano_flores_2024_e5f6g7h8i9j0',
   NOW() - INTERVAL '15 days',
   '2024-2025',
   NULL),

  -- Categoría Sub-15
  ('d0000000-0000-0000-0000-000000000006',
   'Andrés', 'Torres Vega', '2010-01-12', 'Mexicana',
   'Mediocampista Ofensivo', 'Delantero', 10,
   'right', 165, 58,
   'Sub-15',
   'Talento nato con visión de juego avanzada para su edad. Gran técnica individual y capacidad creativa.',
   'active', TRUE, NOW() - INTERVAL '22 days', 'b0000000-0000-0000-0000-000000000001',
   'qr_andres_torres_2024_f6g7h8i9j0k1l2',
   NOW() - INTERVAL '22 days',
   '2024-2025',
   'Mejor jugador del torneo Sub-15 estatal 2024.'),

  ('d0000000-0000-0000-0000-000000000007',
   'Santiago', 'Morales Díaz', '2010-04-25', 'Mexicana',
   'Delantero Centro', NULL, 7,
   'right', 163, 55,
   'Sub-15',
   'Delantero rápido con olfato goleador. Destacado en el juego aéreo pese a su estatura.',
   'active', TRUE, NOW() - INTERVAL '18 days', 'b0000000-0000-0000-0000-000000000002',
   'qr_santiago_morales_2024_g7h8i9j0k1l2',
   NOW() - INTERVAL '18 days',
   '2024-2025',
   NULL),

  -- Jugadores pendientes de verificación
  ('d0000000-0000-0000-0000-000000000008',
   'Nicolás', 'Castro Peña', '2009-08-14', 'Mexicana',
   'Lateral Izquierdo', 'Defensa Central', 3,
   'left', 170, 66,
   'Sub-15',
   'Lateral izquierdo con gran capacidad ofensiva. Buen trabajo defensivo y técnica depurada.',
   'pending_verification', FALSE, NULL, NULL,
   NULL, NULL,
   '2024-2025',
   NULL),

  ('d0000000-0000-0000-0000-000000000009',
   'Javier', 'Reyes Muñoz', '2008-12-03', 'Mexicana',
   'Defensa Central', NULL, 4,
   'right', 176, 72,
   'Sub-17',
   'Defensa central físicamente fuerte. Excelente en duelos aéreos y marca personal.',
   'pending_verification', FALSE, NULL, NULL,
   NULL, NULL,
   '2024-2025',
   NULL),

  -- Categoría Sub-13
  ('d0000000-0000-0000-0000-000000000010',
   'Bruno', 'Silva Mendoza', '2012-06-08', 'Mexicana',
   'Mediocampista Central', 'Mediocampista Defensivo', 6,
   'right', 152, 48,
   'Sub-13',
   'Joven promesa del mediocampo. Gran inteligencia táctica y excelente primer toque.',
   'active', TRUE, NOW() - INTERVAL '10 days', 'b0000000-0000-0000-0000-000000000001',
   'qr_bruno_silva_2024_h8i9j0k1l2m3n4o5',
   NOW() - INTERVAL '10 days',
   '2024-2025',
   NULL);

-- ============================================================
-- RELACIÓN PADRES - JUGADORES
-- ============================================================
INSERT INTO parent_players (parent_id, player_id, is_primary_contact)
VALUES
  ('c0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001', TRUE),
  ('c0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', TRUE),
  ('c0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000003', TRUE),
  ('c0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000004', TRUE),
  ('c0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005', TRUE),
  ('c0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', TRUE),
  -- Un padre con dos hijos
  ('c0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000010', FALSE);

-- ============================================================
-- PARTIDOS
-- ============================================================
INSERT INTO matches (
  id, title, opponent_name, match_date, location,
  match_type, category, status, is_home, season, created_by
) VALUES
  -- Partidos pasados
  ('e0000000-0000-0000-0000-000000000001',
   'Academia Barcelona vs Tigres Academia',
   'Tigres Academia',
   NOW() - INTERVAL '21 days',
   'Estadio Municipal San Pedro',
   'league', 'Sub-17', 'completed', TRUE, '2024-2025',
   'b0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000002',
   'Monterrey Academy vs Academia Barcelona',
   'Monterrey Academy',
   NOW() - INTERVAL '14 days',
   'Estadio BBVA Academy',
   'league', 'Sub-17', 'completed', FALSE, '2024-2025',
   'b0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000003',
   'Academia Barcelona vs Santos Juvenil',
   'Santos Juvenil',
   NOW() - INTERVAL '7 days',
   'Campo de Entrenamiento Barcelona',
   'friendly', 'Sub-15', 'completed', TRUE, '2024-2025',
   'b0000000-0000-0000-0000-000000000002'),

  -- Partido esta semana (futuro)
  ('e0000000-0000-0000-0000-000000000004',
   'Academia Barcelona vs Cruz Azul Academy',
   'Cruz Azul Academy',
   NOW() + INTERVAL '5 days',
   'Campo de Entrenamiento Barcelona',
   'league', 'Sub-17', 'scheduled', TRUE, '2024-2025',
   'b0000000-0000-0000-0000-000000000001'),

  ('e0000000-0000-0000-0000-000000000005',
   'Chivas Fútbol Club vs Academia Barcelona',
   'Chivas Fútbol Club Sub-15',
   NOW() + INTERVAL '12 days',
   'Centro de Formación Chivas',
   'league', 'Sub-15', 'scheduled', FALSE, '2024-2025',
   'b0000000-0000-0000-0000-000000000002'),

  ('e0000000-0000-0000-0000-000000000006',
   'Copa Navidad - Academia Barcelona vs América Academy',
   'América Academy',
   NOW() + INTERVAL '20 days',
   'Estadio Municipal San Pedro',
   'cup', 'Sub-17', 'scheduled', TRUE, '2024-2025',
   'b0000000-0000-0000-0000-000000000001');

-- ============================================================
-- CONVOCATORIAS
-- ============================================================
INSERT INTO match_convocatories (match_id, player_id, status)
VALUES
  -- Convocatoria partido vs Tigres (e0000000-1)
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'confirmed'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'confirmed'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'confirmed'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'confirmed'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'confirmed'),

  -- Convocatoria próximo partido vs Cruz Azul
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'called'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'called'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'called'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'confirmed'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 'called');

-- ============================================================
-- RESULTADOS
-- ============================================================
INSERT INTO results (
  id, match_id,
  goals_scored, goals_conceded,
  match_report, featured_player_id,
  published, published_at, created_by
) VALUES
  ('f0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   3, 1,
   'Gran victoria del equipo Sub-17. Lucas García fue figura con 2 goles y una asistencia. El equipo demostró solidez defensiva y efectividad en el ataque. Tigres solo logró descontar en el último minuto.',
   'd0000000-0000-0000-0000-000000000001',
   TRUE, NOW() - INTERVAL '20 days',
   'b0000000-0000-0000-0000-000000000001'),

  ('f0000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000002',
   1, 1,
   'Empate trabajado ante un difícil rival en su casa. El equipo mostró carácter al igualar en el último minuto gracias a un gol de Diego López.',
   'd0000000-0000-0000-0000-000000000002',
   TRUE, NOW() - INTERVAL '13 days',
   'b0000000-0000-0000-0000-000000000001'),

  ('f0000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000003',
   4, 0,
   'Goleada contundente del Sub-15 en partido amistoso. Gran actuación colectiva con goles repartidos entre diferentes jugadores.',
   'd0000000-0000-0000-0000-000000000006',
   TRUE, NOW() - INTERVAL '6 days',
   'b0000000-0000-0000-0000-000000000002');

-- ============================================================
-- ESTADÍSTICAS POR JUGADOR
-- ============================================================
INSERT INTO player_stats (
  result_id, player_id,
  goals, assists, yellow_cards, red_cards, minutes_played, rating, notes
) VALUES
  -- Partido 1 (3-1 vs Tigres)
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 2, 1, 0, 0, 90, 9.2, 'Figura del partido. Doblete y asistencia.'),
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 1, 0, 1, 0, 85, 7.8, 'Gol de media distancia espectacular. Amonestado.'),
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 0, 0, 0, 0, 90, 8.0, 'Paró 4 tiros a puerta. Seguro bajo los palos.'),
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 0, 1, 0, 0, 90, 7.5, 'Capitán sólido. Importante en salida de balón.'),
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 0, 1, 0, 0, 80, 7.2, 'Desborde constante por la banda izquierda.'),

  -- Partido 2 (1-1 vs Monterrey)
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 0, 1, 0, 0, 90, 7.0, 'Creó oportunidades pero sin fortuna de cara al gol.'),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 1, 0, 0, 0, 90, 8.5, 'Golazo en el minuto 88 para el empate.'),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 0, 0, 0, 0, 90, 7.8, 'Varias atajadas importantes en la segunda mitad.'),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 0, 0, 1, 0, 90, 6.5, 'Partido complicado ante atacantes rápidos. Amarilla innecesaria.'),

  -- Partido 3 (4-0 Sub-15)
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006', 2, 2, 0, 0, 90, 9.5, 'Figura indiscutible. Dos goles y dos asistencias.'),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000007', 2, 0, 0, 0, 75, 8.2, 'Dos goles bien ejecutados. Salió por precaución.');

-- ============================================================
-- AVISOS
-- ============================================================
INSERT INTO notices (
  id, title, content, type, audience,
  is_published, published_at, is_pinned,
  created_by
) VALUES
  ('aa000000-0000-0000-0000-000000000001',
   'Bienvenida a la Temporada 2024-2025',
   'Estimadas familias de Academia Barcelona,\n\nNos complace dar inicio a una nueva temporada llena de retos y aprendizajes. Este año trabajaremos con un enfoque especial en el desarrollo técnico y táctico de cada jugador.\n\nEsperamos contar con su apoyo incondicional durante toda la temporada. ¡Juntos somos más fuertes!\n\nAtentamente,\nCuerpo Técnico Academia Barcelona',
   'general', 'all',
   TRUE, NOW() - INTERVAL '60 days', TRUE,
   'b0000000-0000-0000-0000-000000000001'),

  ('aa000000-0000-0000-0000-000000000002',
   'Próximos Partidos - Semana 12 al 18 de Mayo',
   'Recordamos a todas las familias los partidos programados para esta semana:\n\n📅 Miércoles 14 de Mayo\n⚽ Sub-17 vs Cruz Azul Academy\n🏟️ Campo de Entrenamiento Barcelona\n🕐 16:00 hrs\n\nLos jugadores convocados deben presentarse con 45 minutos de anticipación. Traer uniforme completo y calzado de pasto.\n\n¡Los esperamos con su apoyo!',
   'match', 'all',
   TRUE, NOW() - INTERVAL '3 days', FALSE,
   'b0000000-0000-0000-0000-000000000002'),

  ('aa000000-0000-0000-0000-000000000003',
   'Actualización de Credenciales QR - Acción Requerida',
   'Estimados padres de familia,\n\nInformamos que se han actualizado las credenciales digitales QR de todos los jugadores verificados. Por favor asegúrense de tener la aplicación actualizada para acceder a las nuevas credenciales.\n\nLas credenciales son requeridas para el acceso a partidos de torneo. Si tienen algún inconveniente, comuníquense con la administración.',
   'administrative', 'parents',
   TRUE, NOW() - INTERVAL '5 days', FALSE,
   'b0000000-0000-0000-0000-000000000001'),

  ('aa000000-0000-0000-0000-000000000004',
   'Copa Navidad 2024 - Inscripción Confirmada',
   '¡Excelente noticia para todas las familias! Academia Barcelona ha confirmado su participación en la Copa Navidad 2024, el torneo más importante de la región en temporada navideña.\n\nParticipamos en categorías Sub-13, Sub-15 y Sub-17.\n\nFecha de inicio: 20 de Diciembre 2024\nSede: Estadio Municipal San Pedro\n\n¡Prepárense para vivir una experiencia única!',
   'event', 'all',
   TRUE, NOW() - INTERVAL '1 day', TRUE,
   'b0000000-0000-0000-0000-000000000001'),

  -- Aviso sin publicar (borrador)
  ('aa000000-0000-0000-0000-000000000005',
   'Cambio de Horario Entrenamientos Diciembre',
   'Durante el mes de diciembre los entrenamientos tendrán horario especial debido a las festividades. Se informará la semana del 25 de noviembre.',
   'training', 'parents',
   FALSE, NULL, FALSE,
   'b0000000-0000-0000-0000-000000000002');

-- ============================================================
-- GALERÍA
-- ============================================================
INSERT INTO gallery_posts (
  id, title, caption, type,
  related_match_id, related_player_id,
  is_published, published_at, is_featured,
  views_count, likes_count,
  season, created_by
) VALUES
  ('ab000000-0000-0000-0000-000000000001',
   'Victoria 3-1 vs Tigres Academia',
   '¡VICTORIA! 🏆 El Sub-17 demostró su potencial con una gran actuación frente a Tigres Academia. Lucas García fue la figura del partido con 2 goles y 1 asistencia. ¡Así se juega Barcelona! 🔵🟡 #AcademiaBarcelona #Sub17 #MásQueUnClub',
   'result',
   'e0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   TRUE, NOW() - INTERVAL '20 days', TRUE,
   324, 89,
   '2024-2025', 'b0000000-0000-0000-0000-000000000001'),

  ('ab000000-0000-0000-0000-000000000002',
   'Entrenamiento de Alta Intensidad Sub-17',
   'Sesión de entrenamiento enfocada en presión alta y transiciones rápidas. El equipo muestra una gran evolución táctica bajo la guía del Profe Miguel. 💪 #Entrenamiento #Sub17 #Preparación',
   'training',
   NULL, NULL,
   TRUE, NOW() - INTERVAL '18 days', FALSE,
   187, 56,
   '2024-2025', 'b0000000-0000-0000-0000-000000000002'),

  ('ab000000-0000-0000-0000-000000000003',
   'Jugador Destacado: Lucas García',
   '⭐ JUGADOR DE LA SEMANA ⭐\n\nLucas García, nuestro #9, sigue demostrando por qué es uno de los mejores delanteros de su generación. Con 8 goles en 6 partidos esta temporada, Lucas es la pesadilla de las defensas rivales.\n\n"Mi objetivo es seguir creciendo con el equipo y representar a la academia de la mejor manera" - Lucas García 🎯',
   'featured_player',
   NULL,
   'd0000000-0000-0000-0000-000000000001',
   TRUE, NOW() - INTERVAL '15 days', TRUE,
   445, 132,
   '2024-2025', 'b0000000-0000-0000-0000-000000000001'),

  ('ab000000-0000-0000-0000-000000000004',
   'Match Day - Sub-17 vs Cruz Azul Academy',
   '🔵🟡 MATCH DAY 🔵🟡\n\nHoy es el día. El Sub-17 recibe a Cruz Azul Academy en nuestro campo. Los esperamos a todos con sus colores.\n\n📅 Miércoles 14 de Mayo\n🏟️ Campo Barcelona\n🕐 16:00 hrs\n\n¡Vengan a apoyar a sus campeones! 🙌',
   'match_day',
   'e0000000-0000-0000-0000-000000000004',
   NULL,
   TRUE, NOW() - INTERVAL '1 day', FALSE,
   203, 74,
   '2024-2025', 'b0000000-0000-0000-0000-000000000001'),

  ('ab000000-0000-0000-0000-000000000005',
   'Convocatoria Sub-17 vs Cruz Azul Academy',
   '📋 CONVOCATORIA OFICIAL\n\nEl cuerpo técnico ha dado a conocer la lista de convocados para el partido de este miércoles frente a Cruz Azul Academy.\n\n¡Mucha suerte a todos los jugadores! 💪🔵',
   'convocatory',
   'e0000000-0000-0000-0000-000000000004',
   NULL,
   TRUE, NOW() - INTERVAL '2 days', FALSE,
   156, 41,
   '2024-2025', 'b0000000-0000-0000-0000-000000000002'),

  ('ab000000-0000-0000-0000-000000000006',
   'Goleada 4-0 del Sub-15 vs Santos',
   '¡IMPARABLES! 🔥 El Sub-15 no tuvo piedad con Santos Juvenil en un partido amistoso que terminó 4-0. Andrés Torres fue la gran figura con doblete y dos asistencias. ¡El futuro del club está en buenas manos! 🌟',
   'result',
   'e0000000-0000-0000-0000-000000000003',
   'd0000000-0000-0000-0000-000000000006',
   TRUE, NOW() - INTERVAL '6 days', FALSE,
   278, 95,
   '2024-2025', 'b0000000-0000-0000-0000-000000000002');

-- ============================================================
-- GALERÍA MEDIA (imágenes por post)
-- URLs de ejemplo - en producción serían URLs de Supabase Storage
-- ============================================================
INSERT INTO gallery_media (post_id, url, type, thumbnail_url, caption, sort_order)
VALUES
  ('ab000000-0000-0000-0000-000000000001',
   'https://storage.barcelonamty.com/gallery/partido-tigres-1.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/partido-tigres-1.jpg',
   'Lucas García celebrando su primer gol', 0),

  ('ab000000-0000-0000-0000-000000000001',
   'https://storage.barcelonamty.com/gallery/partido-tigres-2.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/partido-tigres-2.jpg',
   'Festejo colectivo del equipo', 1),

  ('ab000000-0000-0000-0000-000000000001',
   'https://storage.barcelonamty.com/gallery/partido-tigres-3.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/partido-tigres-3.jpg',
   'Final del partido, equipo unido', 2),

  ('ab000000-0000-0000-0000-000000000003',
   'https://storage.barcelonamty.com/gallery/lucas-garcia-profile.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/lucas-garcia-profile.jpg',
   'Sesión fotográfica Lucas García', 0),

  ('ab000000-0000-0000-0000-000000000006',
   'https://storage.barcelonamty.com/gallery/sub15-santos-1.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/sub15-santos-1.jpg',
   'Andrés Torres marcando el primer gol', 0),

  ('ab000000-0000-0000-0000-000000000006',
   'https://storage.barcelonamty.com/gallery/sub15-santos-2.jpg',
   'image',
   'https://storage.barcelonamty.com/gallery/thumbs/sub15-santos-2.jpg',
   'El equipo Sub-15 tras la goleada', 1);

-- ============================================================
-- SOLICITUDES DE INSCRIPCIÓN
-- ============================================================
INSERT INTO inscriptions (
  id,
  parent_first_name, parent_last_name, parent_email, parent_phone, parent_relationship,
  player_first_name, player_last_name, player_birth_date, player_nationality,
  player_position, player_dominant_foot, player_height_cm, player_weight_kg,
  player_category, player_previous_club, player_sport_description,
  status
) VALUES
  -- Solicitud pendiente
  ('ac000000-0000-0000-0000-000000000001',
   'Carlos', 'Mendoza Ibarra', 'cmendoza@email.com', '+52 81 7777 8888', 'padre',
   'Rodrigo', 'Mendoza Ruiz', '2009-04-20', 'Mexicana',
   'Mediocampista Central', 'right', 168, 62,
   'Sub-15', 'Tigres Juvenil',
   'Jugador con 3 años de experiencia en fútbol de liga. Buen físico y técnica básica sólida.',
   'pending'),

  -- Solicitud en revisión
  ('ac000000-0000-0000-0000-000000000002',
   'Patricia', 'Serna Villegas', 'pserna@email.com', '+52 81 8888 9999', 'madre',
   'Iván', 'Serna García', '2011-09-15', 'Mexicana',
   'Portero', 'right', 155, 50,
   'Sub-13', NULL,
   'Mi hijo lleva 2 años entrenando fútbol. Tiene muchas ganas de aprender y mejorar.',
   'under_review'),

  -- Solicitud aprobada (convertida a jugador)
  ('ac000000-0000-0000-0000-000000000003',
   'Alejandro', 'García Morales', 'padre1@email.com', '+52 81 1111 2222', 'padre',
   'Lucas', 'García Torres', '2008-03-15', 'Mexicana',
   'Delantero Centro', 'right', 175, 68,
   'Sub-17', 'América Juvenil',
   'Jugador con 5 años de experiencia. Gran goleador en su categoría.',
   'approved'),

  -- Solicitud rechazada
  ('ac000000-0000-0000-0000-000000000004',
   'Roberto', 'Castañeda López', 'rcastaneda@email.com', '+52 81 9999 0000', 'padre',
   'Marco', 'Castañeda Ruiz', '2005-01-10', 'Mexicana',
   'Delantero', 'right', 178, 70,
   'Sub-17', NULL,
   'Mi hijo quiere unirse a la academia.',
   'rejected');

-- Actualizar inscripción rechazada con motivo
UPDATE inscriptions
SET
  rejection_reason = 'El jugador supera la edad máxima permitida para la categoría Sub-17. Se recomienda intentar en la categoría Sub-19 cuando esté disponible.',
  reviewed_by      = 'b0000000-0000-0000-0000-000000000001',
  reviewed_at      = NOW() - INTERVAL '5 days'
WHERE id = 'ac000000-0000-0000-0000-000000000004';

-- Actualizar inscripción aprobada
UPDATE inscriptions
SET
  review_notes     = 'Jugador con excelente historial. Aprobado para categoría Sub-17.',
  reviewed_by      = 'b0000000-0000-0000-0000-000000000001',
  reviewed_at      = NOW() - INTERVAL '35 days',
  converted_player_id = 'd0000000-0000-0000-0000-000000000001',
  converted_at     = NOW() - INTERVAL '34 days'
WHERE id = 'ac000000-0000-0000-0000-000000000003';

-- ============================================================
-- FIN DEL SEED
-- ============================================================
-- Resumen de datos insertados:
-- • 1  configuración de club
-- • 8  usuarios (1 admin, 2 coaches, 5 padres)
-- • 6  perfiles de padres
-- • 10 jugadores (7 verificados, 2 pendientes, 1 inactivo)
-- • 7  relaciones padre-jugador
-- • 6  partidos (3 completados, 3 próximos)
-- • 10 convocatorias
-- • 3  resultados publicados
-- • 11 estadísticas de jugadores
-- • 5  avisos (4 publicados, 1 borrador)
-- • 6  publicaciones de galería
-- • 6  archivos multimedia
-- • 4  solicitudes de inscripción
-- ============================================================
