import fp from 'fastify-plugin'
import fs from 'node:fs/promises'

export default fp(async (fastify) => {
  fastify.post('/trades/upload-trades', { onRequest: [ fastify.authenticate ] }, async (request, reply) => {
    if (!request.user) reply.code(401).send({ error: 'Unauthorized' })
    const parts = request.parts()
    let part
    let filePath

    while ((part = await parts()) !== null) {
      if (part.file) {
        const filename = part.filename.replace(/[^a-zA-Z0-9.]/g, '_')
        filePath = new URL(`./uploads/${filename}`, import.meta.url).pathname
        const writeStream = fs.createWriteStream(filePath)
        part.pipe(writeStream)
      }
    }

    try {
      const trades = await fastify.tradeMethods.processAndInsertTrades(filePath, request.user)
      reply.send(trades)
    } catch (error) {
      reply.status(401).send({ error: error.message })
    }
  })
})
