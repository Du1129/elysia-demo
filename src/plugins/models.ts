import { Elysia, t } from 'elysia'

import { ErrorModel } from './error'

export namespace CommonModel {
  export const noContentResponse = t.Void()

  export const models = {
    ...ErrorModel.models,
    ApiNoContentResponse: noContentResponse
  } as const
}

export const commonModelsPlugin = new Elysia({ name: 'common-models' })
  .model(CommonModel.models)
