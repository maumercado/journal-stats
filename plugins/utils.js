import fp from 'fastify-plugin'
import { camelCase } from 'lodash-es'

export default fp(async (fastify) => {
  const camelizeKeys = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(v => camelizeKeys(v))
    } else if (obj != null && obj.constructor === Object) {
      return Object.keys(obj).reduce(
        (result, key) => ({
          ...result,
          [camelCase(key)]: camelizeKeys(obj[key])
        }),
        {}
      )
    }
    return obj
  }

  const utils = {
    camelizeKeys
  }

  fastify.decorate('utils', utils)
})
