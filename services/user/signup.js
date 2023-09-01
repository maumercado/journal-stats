import bcrypt from 'bcrypt';
import fp from 'fastify-plugin';

const SALTS = 10;

async function generateHashPassword (password) {
  const saltRounds = SALTS;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};


export default async function userSignup (fastify) {

  fastify.post('/signup', async (request, reply) => {
    const { email, firstName, lastName, password } = request.body;

    // Check if email already exists in database
    const checkUserExistQuery = 'SELECT email FROM users WHERE email=$1';
    const result = await fastify.pg.query(checkUserExistQuery, [email]);

    if (result.rowCount > 0) {
      return reply
        .code(400)
        .send({ success: false, message: 'Email already exists.' });
    }

    // If email doesn't exist, create a new user
    try {
      const hashedPassword = await generateHashedPassword(password);
      const insertUserQuery = 'INSERT INTO profile (email, firstName, lastName, password) VALUES ($1, $2, $3, $4)';
      await fastify.pg.query(insertUserQuery, [email, firstName, lastName, hashedPassword]);
      const token = fastify.jwt.sign({ email, firstName, lastName });

      return reply
        .code(201)
        .send({ success: true, message: 'User created successfully.', token });
    } catch (err) {
      return reply
        .code(500)
        .send({ success: false, message: 'An error occurred while creating the user.' });
    }
  });
}

fp(userSignup, { name: 'userSignup', dependencies: ['pg', 'env'] });
