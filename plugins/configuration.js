import { fileURLToPath } from 'node:url'
import fp from 'fastify-plugin'
import Env from '@fastify/env'

async function Config(app) {
  const schema = {
    type: 'object',
    required: [
      'PGUSER',
      'PGHOST',
      'PGPORT',
      'PGDATABASE',
      'PGPASSWORD',
      'NODE_ENV'
    ],
    properties: {
      PGUSER: {
        type: 'string'
      },
      PGHOST: {
        type: 'string'
      },
      PGPORT: {
        type: 'number',
        default: 5432
      },
      PGDATABASE: {
        type: 'string'
      },
      PGPASSWORD: {
        type: 'string'
      },
      NODE_ENV: {
        type: 'string',
        default: 'development'
      }
    }
  }

  const filePath = new URL('../config/.env', import.meta.url)
  const absolutePath = fileURLToPath(filePath)
  const configOptions = {
    config: "config",
    dotenv: {
      path: absolutePath
    },
    schema,
    removeAdditional: true
  }

  app.register(Env, configOptions)
}

export default fp(Config, { name: 'env' })
