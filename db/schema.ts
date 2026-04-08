import { sqliteTable, text, integer, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2'; // We can use this to match Prisma CUIDs

export const users = sqliteTable('User', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  avatarUrl: text('avatarUrl'),
  motto: text('motto').default('Ready for battle!'),
  rank: text('rank').notNull().default('Bronze'),
  streak: integer('streak').notNull().default(0),
  lastLogDate: text('lastLogDate'),
  allTimeScore: integer('allTimeScore').notNull().default(0),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const categories = sqliteTable('Category', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  weight: integer('weight').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366f1'),
});

export const matches = sqliteTable('Match', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  challengerId: text('challengerId').notNull(),
  opponentId: text('opponentId').notNull(),
  status: text('status').notNull().default('PENDING'),
  startDate: text('startDate'),
  endDate: text('endDate'),
  durationHours: integer('durationHours').notNull().default(24),
  winnerId: text('winnerId'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bets = sqliteTable('Bet', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  matchId: text('matchId').notNull().unique(),
  content: text('content').notNull(),
  challengerApproved: integer('challengerApproved', { mode: 'boolean' }).notNull().default(false),
  opponentApproved: integer('opponentApproved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const matchCategories = sqliteTable('MatchCategory', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  matchId: text('matchId').notNull(),
  categoryId: text('categoryId').notNull(),
}, (t) => ({
  unq: unique().on(t.matchId, t.categoryId)
}));

export const matchTasks = sqliteTable('MatchTask', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  matchId: text('matchId').notNull(),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  categoryId: text('categoryId').notNull(),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const todos = sqliteTable('Todo', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  content: text('content').notNull(),
  isCompleted: integer('isCompleted', { mode: 'boolean' }).notNull().default(false),
  date: text('date').notNull(),
  categoryId: text('categoryId'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const activityLogs = sqliteTable('ActivityLog', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  matchId: text('matchId'),
  matchTaskId: text('matchTaskId'),
  categoryId: text('categoryId').notNull(),
  name: text('name').notNull(),
  durationMinutes: integer('durationMinutes').notNull(),
  score: integer('score').notNull(),
  loggedAt: text('loggedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
  date: text('date').notNull(),
});

export const dailyScores = sqliteTable('DailyScore', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  matchId: text('matchId'),
  date: text('date').notNull(),
  totalScore: integer('totalScore').notNull().default(0),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.matchId, t.date)
}));

export const achievements = sqliteTable('Achievement', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('🏆'),
  rarity: text('rarity').notNull().default('Common'),
});

export const userAchievements = sqliteTable('UserAchievement', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  achievementId: text('achievementId').notNull(),
  awardedAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.achievementId)
}));

export const suspiciousLogs = sqliteTable('SuspiciousLog', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('userId').notNull(),
  reason: text('reason').notNull(),
  metadata: text('metadata'),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const reactions = sqliteTable('Reaction', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  activityLogId: text('activityLogId').notNull(),
  userId: text('userId').notNull(),
  emoji: text('emoji').notNull(),
  createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => ({
  unq: unique().on(t.activityLogId, t.userId, t.emoji)
}));

// -- Relations Map --
export const usersRelations = relations(users, ({ many }) => ({
  activityLogs: many(activityLogs),
  dailyScores: many(dailyScores),
  wonMatches: many(matches, { relationName: 'Winner' }),
  opponentMatches: many(matches, { relationName: 'Opponent' }),
  challengedMatches: many(matches, { relationName: 'Challenger' }),
  suspiciousLogs: many(suspiciousLogs),
  todos: many(todos),
  achievements: many(userAchievements),
  matchTasks: many(matchTasks),
  reactions: many(reactions),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  challenger: one(users, { fields: [matches.challengerId], references: [users.id], relationName: 'Challenger' }),
  opponent: one(users, { fields: [matches.opponentId], references: [users.id], relationName: 'Opponent' }),
  winner: one(users, { fields: [matches.winnerId], references: [users.id], relationName: 'Winner' }),
  bet: one(bets, { fields: [matches.id], references: [bets.matchId] }),
  categories: many(matchCategories),
  matchTasks: many(matchTasks),
  activityLogs: many(activityLogs),
  dailyScores: many(dailyScores),
}));

export const matchCategoriesRelations = relations(matchCategories, ({ one }) => ({
  match: one(matches, { fields: [matchCategories.matchId], references: [matches.id] }),
  category: one(categories, { fields: [matchCategories.categoryId], references: [categories.id] }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  match: one(matches, { fields: [bets.matchId], references: [matches.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  todos: many(todos),
  activityLogs: many(activityLogs),
  matchCategories: many(matchCategories),
  matchTasks: many(matchTasks),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, { fields: [todos.userId], references: [users.id] }),
  category: one(categories, { fields: [todos.categoryId], references: [categories.id] }),
}));

export const matchTasksRelations = relations(matchTasks, ({ one, many }) => ({
  match: one(matches, { fields: [matchTasks.matchId], references: [matches.id] }),
  user: one(users, { fields: [matchTasks.userId], references: [users.id] }),
  category: one(categories, { fields: [matchTasks.categoryId], references: [categories.id] }),
  activityLogs: many(activityLogs),
}));

export const activityLogsRelations = relations(activityLogs, ({ one, many }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
  category: one(categories, { fields: [activityLogs.categoryId], references: [categories.id] }),
  match: one(matches, { fields: [activityLogs.matchId], references: [matches.id] }),
  matchTask: one(matchTasks, { fields: [activityLogs.matchTaskId], references: [matchTasks.id] }),
  reactions: many(reactions),
}));

export const dailyScoresRelations = relations(dailyScores, ({ one }) => ({
  user: one(users, { fields: [dailyScores.userId], references: [users.id] }),
  match: one(matches, { fields: [dailyScores.matchId], references: [matches.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const suspiciousLogsRelations = relations(suspiciousLogs, ({ one }) => ({
  user: one(users, { fields: [suspiciousLogs.userId], references: [users.id] }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
  activityLog: one(activityLogs, { fields: [reactions.activityLogId], references: [activityLogs.id] }),
}));
