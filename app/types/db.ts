import type * as s from "~/db/schema"

export type InsertObservation = typeof s.observation.$inferInsert
export type SelectObservation = typeof s.observation.$inferSelect

export type InsertObservatory = typeof s.observatory.$inferInsert
export type SelectObservatory = typeof s.observatory.$inferSelect

export type InsertPlate = typeof s.plate.$inferInsert
export type SelectPlate = typeof s.plate.$inferSelect

export type InsertProject = typeof s.project.$inferInsert
export type SelectProject = typeof s.project.$inferSelect

export type InsertSpectrum = typeof s.spectrum.$inferInsert
export type SelectSpectrum = typeof s.spectrum.$inferSelect

export type InsertUpload = typeof s.upload.$inferInsert
export type SelectUpload = typeof s.upload.$inferSelect

export type InsertUser = typeof s.user.$inferInsert
export type SelectUser = typeof s.user.$inferSelect

export type InsertUserToProject = typeof s.userToProject.$inferInsert
export type SelectUserToProject = typeof s.userToProject.$inferSelect
