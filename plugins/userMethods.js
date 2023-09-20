import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import bcrypt from 'bcrypt'

const SALT = 10

async function userMethods (fastify) {
  fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET
  })

  const generateHashPassword = async (password) => {
    const saltRounds = SALT
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    return hashedPassword
  }

  const authenticate = async (request) => {
    try {
      await request.jwtVerify({
        verify: async (decoded, request) => {
          const { userId } = decoded

          const getSessionQuery = 'SELECT * FROM sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()'
          const result = await fastify.pg.query(getSessionQuery, [userId, request.token])
          const session = result.rows[0]

          if (!session) {
            throw new Error('Invalid token')
          }
        }
      })
    } catch (err) {
      return err
    }
  }

  const insertUser = async (email, firstName, lastName, hashedPassword) => {
    const client = await fastify.pg.connect()
    const insertUserQuery = 'INSERT INTO profile (email, firstName, lastName, password) VALUES ($1, $2, $3, $4) RETURNING *'
    try {
      const insertedUser = await client.query(insertUserQuery, [email, firstName, lastName, hashedPassword])
      return insertedUser
    } catch (err) {
      fastify.log.error(err, 'Error inserting user.')
      throw err
    } finally {
      client.release()
    }
  }

  const createToken = async (user) => {
    const token = fastify.jwt.sign(user)
    return token
  }

  const createUser = async (email, firstName, lastName, password) => {
    try {
      const hashedPassword = await generateHashPassword(password)
      const { rows } = await insertUser(email, firstName, lastName, hashedPassword)
      const token = await createToken(rows[0])
      return { token, user: rows[0] }
    } catch (err) {
      fastify.log.error(err, 'Error creating user.')
      throw err
    }
  }

  const getUserByEmail = async (email) => {
    const client = await fastify.pg.connect()
    try {
      const getUserQuery = 'SELECT * FROM profile WHERE email=$1'
      const result = await fastify.pg.query(getUserQuery, [email])
      return result
    } catch (err) {
      fastify.log.error(err, 'Error getting user.')
      throw err
    } finally {
      client.release()
    }
  }

  const updateUser = async function (email, firstName, lastName) {
    const client = await fastify.pg.connect()
    const updateUserQuery = 'UPDATE profile SET firstName=$2, lastName=$3 WHERE email=$1 RETURNING email, firstName, lastName'
    try {
      const updatedUser = await fastify.pg.query(updateUserQuery, [email, firstName, lastName])
      return updatedUser
    } catch (err) {
      fastify.log.error(err, 'Error updating user.')
      throw err
    } finally {
      client.release()
    }
  }

  const deleteUser = async function (email) {
    const client = await fastify.pg.connect()
    const deleteUserQuery = 'DELETE FROM profile WHERE email=$1 RETURNING email'
    try {
      const { rows } = await fastify.pg.query(deleteUserQuery, [email])
      return { deletedUser: rows[0] }
    } catch (err) {
      fastify.log.error(err, 'Error deleting user.')
      throw err
    } finally {
      client.release()
    }
  }

  const createUserSession = async function (user, token) {
    const client = await fastify.pg.connect()
    try {
      const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      const createUserSessionQuery = 'INSERT INTO sessions (profile_id, email, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING *'
      const { rows } = await fastify.pg.query(createUserSessionQuery, [user.id, user.email, token, expirationTime.toISOString()])
      return { session: rows[0] }
    } catch (err) {
      fastify.log.error(err, 'Error creating user session.')
      throw err
    } finally {
      client.release()
    }
  }

  const getUserSession = async function (user) {
    const client = await fastify.pg.connect()
    const getUserSessionQuery = 'SELECT * FROM sessions WHERE profile_id=$1 AND email=$2 AND expires_at > NOW()'
    try {
      const { rows } = await fastify.pg.query(getUserSessionQuery, [user.id, user.email])
      return rows.length > 0 ? rows[0] : null
    } catch (err) {
      fastify.log.error(err, 'Error getting user session.')
      throw err
    } finally {
      client.release()
    }
  }

  const deleteUserSession = async function (email) {
    const client = await fastify.pg.connect()
    const deleteUserSessionQuery = 'DELETE FROM sessions WHERE email=$1'
    try {
      await fastify.pg.query(deleteUserSessionQuery, [email])
    } catch (err) {
      fastify.log.error(err, 'Error deleting user session.')
      throw err
    } finally {
      client.release()
    }
  }

  const isPasswordCorrect = async function (password, userPassword) {
    const isPasswordCorrect = await bcrypt.compare(password, userPassword)
    return isPasswordCorrect
  }

  const userMethods = {
    createToken,
    createUser,
    createUserSession,
    deleteUser,
    deleteUserSession,
    generateHashPassword,
    getUserByEmail,
    getUserSession,
    insertUser,
    isPasswordCorrect,
    updateUser
  }

  fastify.decorate('userMethods', userMethods)
  fastify.decorate('authenticate', authenticate)
}

export default fp(userMethods, { name: 'userMethods', dependencies: ['pg', 'env'] })
