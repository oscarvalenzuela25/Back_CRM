require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const { typeDefs } = require('./db/schema.js');
const { resolvers } = require('./db/resolvers.js');
const { decodeToken } = require('./helpers/token.js');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers?.authorization;
    if (token) {
      try {
        const getUser = decodeToken({
          token: token.replace('Bearer', '').trim(),
          seed: process.env.JWT_SEED,
        });
        return {
          user: getUser,
        };
      } catch (error) {
        console.log(error.message);
      }
    }
  },
  csrfPrevention: true,
  cache: 'bounded',
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

const PORT = process.env.PORT || 4000;

server.listen(PORT).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
