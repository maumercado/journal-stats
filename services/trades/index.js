import fp from 'fastify-plugin'
import fs from 'node:fs'
import { access, constants, mkdir } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import filenamify from 'filenamify';

export default fp(async (fastify) => {
  fastify.post('/trades/upload-trades', { onRequest: [ fastify.authenticate ] }, async (request, reply) => {
    if (!request.user) reply.code(401).send({ error: 'Unauthorized' })
    const { user } = request
    const data = await request.file()
    const location = new URL(`../../uploads/${user.id}`, import.meta.url).pathname
    const filePath = `${location}/${filenamify(data.filename, { replacement: '_' })}`
    const exists = await access(location, constants.R_OK | constants.W_OK).then(() => true).catch(() => false)

    try {
      if (!exists) await mkdir(location, { recursive: true })
      await pipeline(data.file, fs.createWriteStream(filePath))
      const trades = await fastify.tradeMethods.processAndInsertTrades(filePath, request.user)
      reply.send(trades)
    } catch (error) {
      reply.status(401).send({ error: error.message })
    }
  })

  fastify.get('/trades', { onRequest: [ fastify.authenticate ] }, async (request, reply) => {
    if (!request.user) reply.code(401).send({ error: 'Unauthorized' })
    const trades = await fastify.tradeMethods.getTradesforUser(request.user)
    reply.send(trades)
  })
})
