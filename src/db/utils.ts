import { Kind, type TObject } from '@sinclair/typebox'
import type { Table } from 'drizzle-orm'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
  type BuildSchema
} from 'drizzle-typebox'

type Spread<
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | 'update' | undefined
> = T extends TObject<infer Fields>
  ? {
      [K in keyof Fields]: Fields[K]
    }
  : T extends Table
    ? Mode extends 'select'
      ? BuildSchema<'select', T['_']['columns'], undefined>['properties']
      : Mode extends 'insert'
        ? BuildSchema<'insert', T['_']['columns'], undefined>['properties']
        : Mode extends 'update'
          ? BuildSchema<'update', T['_']['columns'], undefined>['properties']
          : {}
    : {}

export const spread = <
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | 'update' | undefined
>(
  schema: T,
  mode?: Mode
): Spread<T, Mode> => {
  let schemaObject: TObject

  switch (mode) {
    case 'insert':
      schemaObject = Kind in schema ? schema : createInsertSchema(schema)
      break

    case 'select':
      schemaObject = Kind in schema ? schema : createSelectSchema(schema)
      break

    case 'update':
      schemaObject = Kind in schema ? schema : createUpdateSchema(schema)
      break

    default:
      if (!(Kind in schema)) {
        throw new Error('Expected a TypeBox schema')
      }

      schemaObject = schema
  }

  return { ...schemaObject.properties } as Spread<T, Mode>
}

export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends 'select' | 'insert' | 'update' | undefined
>(
  models: T,
  mode?: Mode
): {
  [K in keyof T]: Spread<T[K], Mode>
} => {
  const schemas: Record<string, unknown> = {}

  for (const key of Object.keys(models)) {
    schemas[key] = spread(models[key], mode)
  }

  return schemas as {
    [K in keyof T]: Spread<T[K], Mode>
  }
}
