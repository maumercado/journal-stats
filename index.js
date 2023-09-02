import Fastify from 'fastify'
import AutoLoad from '@fastify/autoload'
import sensible from '@fastify/sensible'
import fastifyMultiPart from '@fastify/multipart'
import path from 'path'
import fastifyVaultSecrets from '@maumercado/fastify-vault-secrets'
import { fileURLToPath } from 'url'
const PORT = process.env.PORT || 3000
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function startServer(opts) {
  const fastify = Fastify({ logger: true })

  fastify.register(fastifyVaultSecrets('fastify-vault'), {
    path: './config/'
  })

  fastify.register(fastifyMultiPart)
  fastify.register(sensible)

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    ignorePattern: /.*(test).js/,
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'services'),
    ignorePattern: /.*(test).js/,
    options: Object.assign({}, opts),
    dirNameRoutePrefix: false
  })

  return fastify
}

startServer()
  .then((server) => {
    console.log(server.printRoutes())
    return server.listen({port: PORT})
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
