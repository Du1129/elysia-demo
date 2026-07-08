import { integer, timestamp, type PgColumnBuilderBase } from 'drizzle-orm/pg-core'

type TableColumns = Record<string, PgColumnBuilderBase>
type BaseColumnOptions = {
  softDelete?: boolean
}

const requiredBaseColumns = () => ({
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
})

export const softDeleteColumns = () => ({
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

type BaseColumns = ReturnType<typeof requiredBaseColumns>
type SoftDeleteColumns = ReturnType<typeof softDeleteColumns>

export function baseColumns(options: { softDelete: true }): BaseColumns & SoftDeleteColumns
export function baseColumns(options?: BaseColumnOptions): BaseColumns
export function baseColumns(options: BaseColumnOptions = {}) {
  const columns = requiredBaseColumns()

  if (!options.softDelete) {
    return columns
  }

  return {
    ...columns,
    ...softDeleteColumns()
  }
}

export function withBaseColumns<TColumns extends TableColumns>(
  columns: TColumns,
  options: { softDelete: true }
): BaseColumns & SoftDeleteColumns & TColumns
export function withBaseColumns<TColumns extends TableColumns>(
  columns: TColumns,
  options?: BaseColumnOptions
): BaseColumns & TColumns
export function withBaseColumns<TColumns extends TableColumns>(
  columns: TColumns,
  options: BaseColumnOptions = {}
) {
  return {
    ...baseColumns(options),
    ...columns
  }
}
