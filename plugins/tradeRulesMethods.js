import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  const insertRuleList = async (user, jsonRuleList) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query(
        'INSERT INTO trade_rules (rule_list, profile_id) VALUES ($1, $2) RETURNING *',
        [JSON.stringify(jsonRuleList), user.id]
      )
      return result.rows[0]
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const getEnabledRuleLists = async (user) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query('SELECT * FROM trade_rules WHERE disabled = false AND profile_id = $1', [user.id])
      return { rules: result.rows.map((row) => fastify.utils.camelizeKeys(row)), count: result.rows.length }
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const getDisabledRuleLists = async (user) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query('SELECT * FROM trade_rules WHERE disabled = true AND profile_id = $1', [user.id])
      return result.rows
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const getRuleListById = async (user, id) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query(
        'SELECT * FROM trade_rules WHERE disabled = false AND profile_id = $1 AND id = $2',
        [user.id, id]
      )
      if (result.rows.length === 0) {
        throw new Error('Rule list not found')
      } else {
        return result.rows[0]
      }
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const updateRuleList = async (user, id, jsonRuleList) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query(
        'UPDATE trade_rules SET rule_list = $1 WHERE profile_id = $2 AND id = $3 RETURNING *',
        [JSON.stringify(jsonRuleList), user.id, id]
      )
      if (result.rows.length === 0) {
        throw new Error('Rule list not found')
      } else {
        return result.rows[0]
      }
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const disableRuleList = async (user, id) => {
    const client = await fastify.pg.connect()
    try {
      const result = await client.query(
        'UPDATE trade_rules SET disabled = true WHERE profile_id = $1 AND id = $2 RETURNING *',
        [user.id, id]
      )
      if (result.rows.length === 0) {
        throw new Error('Rule list not found')
      } else {
        return result.rows[0]
      }
    } catch (e) {
      throw new Error(e.message)
    } finally {
      client.release()
    }
  }

  const tradeRuleMethods = {
    insertRuleList,
    getEnabledRuleLists,
    getDisabledRuleLists,
    getRuleListById,
    updateRuleList,
    disableRuleList
  }

  fastify.decorate('tradeRulesMethods', tradeRuleMethods)
})
