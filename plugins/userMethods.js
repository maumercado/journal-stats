import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import bcrypt from 'bcrypt'

const SALT = 10;

async function userMethods(fastify) {

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
    const insertUserQuery = 'INSERT INTO profile (email, firstName, lastName, password) VALUES ($1, $2, $3, $4)'
    try {
      await fastify.pg.query(insertUserQuery, [email, firstName, lastName, hashedPassword])
    } finally {
      client.release()
    }
  }

  const createToken = async (email, firstName, lastName) => {
    const token = fastify.jwt.sign({ email, firstName, lastName })
    return token
  }

  const createUser = async (email, firstName, lastName, password) => {
    try {
      const hashedPassword = await fastify.generateHashPassword(password)
      await fastify.insertUser(email, firstName, lastName, hashedPassword)
      const token = await fastify.createToken(email, firstName, lastName)

      return token
    } catch (err) {
      fastify.log.error(err, 'Error creating user.')
      return err
    }
  }


  const getUserByEmail = async (email) => {
    const getUserQuery = 'SELECT * FROM profile WHERE email=$1'
    const result = await fastify.pg.query(getUserQuery, [email])
    return result
  }


  const updateUser = async function (email, firstName, lastName) {
    const client = await fastify.pg.connect()
    const updateUserQuery = 'UPDATE profile SET firstName=$2, lastName=$3 WHERE email=$1'
    try {
      await fastify.pg.query(updateUserQuery, [email, firstName, lastName])
    } finally {
      client.release()
    }
  }

  const deleteUser = async function (email) {
    const client = await fastify.pg.connect()
    const deleteUserQuery = 'DELETE FROM profile WHERE email=$1'
    try {
      await fastify.pg.query(deleteUserQuery, [email])
    } catch (err) {
      fastify.log.error(err, 'Error deleting user.')
    } finally {
      client.release()
    }
  }

  const createUserSession = async function (email, token) {
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    const createUserSessionQuery = 'INSERT INTO sessions (email, token, expiresAt) VALUES ($1, $2, $3)'
    await fastify.pg.query(createUserSessionQuery, [email, token, expirationTime.toISOString()])
  }

  const getUserSession = async function (email) {
    const getUserSessionQuery = 'SELECT * FROM sessions WHERE email=$1'
    const result = await fastify.pg.query(getUserSessionQuery, [email])
    return result
  }

  const deleteUserSession = async function (email) {
    const deleteUserSessionQuery = 'DELETE FROM sessions WHERE email=$1'
    await fastify.pg.query(deleteUserSessionQuery, [email])
  }

  const isPasswordCorrect = async function (password, userPassword) {
    const isPasswordCorrect = await bcrypt.compare(password, userPassword)
    return isPasswordCorrect
  }

  fastify.decorate('authenticate', authenticate)
  fastify.decorate('createToken', createToken)
  fastify.decorate('createUser', createUser)
  fastify.decorate('createUserSession', createUserSession)
  fastify.decorate('deleteUser', deleteUser)
  fastify.decorate('deleteUserSession', deleteUserSession)
  fastify.decorate('generateHashPassword', generateHashPassword)
  fastify.decorate('getUserByEmail', getUserByEmail)
  fastify.decorate('getUserSession', getUserSession)
  fastify.decorate('insertUser', insertUser)
  fastify.decorate('isPasswordCorrect', isPasswordCorrect)
  fastify.decorate('updateUser', updateUser)
}

export default fp(userMethods, { name: 'userMethods', dependencies: ['pg', 'env'] })
