-- ============================================================
-- Seed Categories (Critical 4pt | Important 2pt | Relaxing 1pt)
-- ============================================================
INSERT OR REPLACE INTO Category (id, name, weight, description, color) VALUES
  ('cat_critical',  'Critical',  4, 'High-impact tasks that move the needle. e.g. Studying, Deep Work, Exam Prep', '#6366f1'),
  ('cat_important', 'Important', 2, 'Valuable tasks with moderate impact. e.g. Learning to code, Side projects, Fitness', '#f59e0b'),
  ('cat_relaxing',  'Relaxing',  1, 'Rest, hobbies and light activities. e.g. Watching films, Reading Webtoons, Drawing', '#10b981');

-- ============================================================
-- Seed Achievements
-- ============================================================
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES
  ('ach_1',  'FIRST_LOG',      'First Step',     'Log your very first activity',            '🚀', 'Common'),
  ('ach_2',  'STREAK_3',       'On Fire',         'Maintain a 3-day streak',                 '🔥', 'Common'),
  ('ach_3',  'STREAK_7',       'Week Warrior',    'Maintain a 7-day streak',                 '⚡', 'Rare'),
  ('ach_4',  'STREAK_30',      'Unstoppable',     'Maintain a 30-day streak',                '💎', 'Legendary'),
  ('ach_5',  'SCORE_1000',     'Points Hunter',   'Earn 1,000 points in a single day',       '💯', 'Rare'),
  ('ach_6',  'SCORE_5000',     'Score Machine',   'Earn 5,000 total points',                 '🎯', 'Rare'),
  ('ach_7',  'SCORE_10000',    'Elite Scorer',    'Earn 10,000 total points',                '👑', 'Epic'),
  ('ach_8',  'MATCH_WIN',      'Victor',          'Win your first match',                    '🏆', 'Rare'),
  ('ach_9',  'MATCH_WIN_3',    'Champion',        'Win 3 matches',                           '🥇', 'Epic'),
  ('ach_10', 'MATCH_WIN_10',   'Legend',          'Win 10 matches',                          '🌟', 'Legendary'),
  ('ach_11', 'FIRST_MATCH',    'Challenger',      'Create your first match',                 '⚔️', 'Common'),
  ('ach_12', 'EARLY_BIRD',     'Early Bird',      'Log an activity before 8 AM',             '🌅', 'Rare'),
  ('ach_13', 'NIGHT_OWL',      'Night Owl',       'Log an activity after 10 PM',             '🦉', 'Rare'),
  ('ach_14', 'ALL_CATEGORIES', 'Balanced',        'Log activities in all 3 categories in one day', '⚖️', 'Epic'),
  ('ach_15', 'GOLD_RANK',      'Gold Achiever',   'Reach Gold rank',                         '🥇', 'Epic');

-- ============================================================
-- Test Users  (bcrypt hash of password shown in comment)
-- mizu  → mizumizu  | ray → rayray
-- These hashes must match what the auth system expects.
-- NOTE: Replace these hash values with the real bcrypt output
--       from: node -e "require('bcryptjs').hash('mizumizu',10).then(console.log)"
-- ============================================================
-- User mizu (mizu@gmail.com / mizumizu)
INSERT OR IGNORE INTO User (id, username, email, passwordHash, rank, streak, allTimeScore, createdAt, updatedAt)
VALUES (
  'user_mizu',
  'mizu',
  'mizu@gmail.com',
  '$2b$10$BAD3ZfvlHu4MLoMacE9yE.VCdIw5ABG9V6tJ1PH9BEIJl1H.RCIHW',
  'Bronze', 0, 0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- User ray (ray@gmail.com / rayray)
INSERT OR IGNORE INTO User (id, username, email, passwordHash, rank, streak, allTimeScore, createdAt, updatedAt)
VALUES (
  'user_ray',
  'ray',
  'ray@gmail.com',
  '$2b$10$6ajGuL9Il6ab6GTLnZR00ep7G1upoBRXE49.oRO0ZPrMVyrcpHCMq',
  'Bronze', 0, 0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
