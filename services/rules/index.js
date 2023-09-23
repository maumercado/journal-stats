import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  fastify.post('/rule_lists', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            selected: { type: 'boolean', default: false }
          },
          required: ['text', 'selected']
        }
      }
    }
  }, async (request, reply) => {
    const jsonRuleList = request.body
    try {
      const insertedRuleList = await fastify.tradeRulesMethods.insertRuleList(request.user, jsonRuleList)
      return fastify.utils.camelizeKeys(insertedRuleList)
    } catch (err) {
      request.log.error(err)
      reply.status(500).send({ error: err.message })
    }
  })

  fastify.get('/rule_lists/disabled', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await fastify.tradeRulesMethods.getDisabledRuleLists(request.user)
      reply.send({ rules: result.map((rulelist) => fastify.utils.camelizeKeys(rulelist)), count: result.length })
    } catch (e) {
      reply.status(500).send({ error: e.message })
    }
  })

  fastify.get('/rule_lists', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const result = await fastify.tradeRulesMethods.getEnabledRuleLists(request.user)
      reply.send({ rules: result.map((ruleList) => fastify.utils.camelizeKeys(ruleList)), count: result.length })
    } catch (e) {
      reply.status(500).send({ error: e.message })
    }
  })

  fastify.get('/rule_lists/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params

    try {
      const ruleList = await fastify.tradeRulesMethods.getRuleListById(request.user, id)
      reply.send(fastify.utils.camelizeKeys(ruleList))
    } catch (e) {
      reply.status(500).send({ error: e.message })
    }
  })

  fastify.put('/rule_lists/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            selected: { type: 'boolean', default: false }
          },
          required: ['text', 'selected']
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const jsonRuleList = request.body
    try {
      const result = await fastify.tradeRulesMethods.updateRuleList(request.user, id, jsonRuleList)
      reply.send(fastify.utils.camelizeKeys(result))
    } catch (e) {
      reply.status(500).send({ error: e.message })
    }
  })

  fastify.put('/rule_lists/:id/disable', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params
    try {
      const result = await fastify.tradeRulesMethods.disableRuleList(request.user, id)
      reply.send(fastify.utils.camelizeKeys(result))
    } catch (e) {
      reply.status(500).send({ error: e.message })
    }
  })
})
