-- Seed Categories
INSERT OR IGNORE INTO Category (id, name, weight, description, color) VALUES ('cat_1', 'Important', 4, 'High-priority work and deep focus tasks', '#6366f1');
INSERT OR IGNORE INTO Category (id, name, weight, description, color) VALUES ('cat_2', 'Less Important', 2, 'Moderate priority tasks and side projects', '#f59e0b');
INSERT OR IGNORE INTO Category (id, name, weight, description, color) VALUES ('cat_3', 'For Relaxing', 1, 'Rest, hobbies, and light activities', '#10b981');

-- Seed Achievements
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_1', 'FIRST_LOG', 'First Step', 'Log your very first activity', '🚀', 'Common');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_2', 'STREAK_3', 'On Fire', 'Maintain a 3-day streak', '🔥', 'Common');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_3', 'STREAK_7', 'Week Warrior', 'Maintain a 7-day streak', '⚡', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_4', 'STREAK_30', 'Unstoppable', 'Maintain a 30-day streak', '💎', 'Legendary');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_5', 'SCORE_1000', 'Points Hunter', 'Earn 1,000 points in a single day', '💯', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_6', 'SCORE_5000', 'Score Machine', 'Earn 5,000 total points', '🎯', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_7', 'SCORE_10000', 'Elite Scorer', 'Earn 10,000 total points', '👑', 'Epic');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_8', 'MATCH_WIN', 'Victor', 'Win your first match', '🏆', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_9', 'MATCH_WIN_3', 'Champion', 'Win 3 matches', '🥇', 'Epic');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_10', 'MATCH_WIN_10', 'Legend', 'Win 10 matches', '🌟', 'Legendary');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_11', 'FIRST_MATCH', 'Challenger', 'Create your first match', '⚔️', 'Common');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_12', 'EARLY_BIRD', 'Early Bird', 'Log an activity before 8 AM', '🌅', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_13', 'NIGHT_OWL', 'Night Owl', 'Log an activity after 10 PM', '🦉', 'Rare');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_14', 'ALL_CATEGORIES', 'Balanced', 'Log activities in all 3 categories in one day', '⚖️', 'Epic');
INSERT OR IGNORE INTO Achievement (id, code, name, description, icon, rarity) VALUES ('ach_15', 'GOLD_RANK', 'Gold Achiever', 'Reach Gold rank', '🥇', 'Epic');
