require('dotenv').config();
// const { ApolloServer } = require('apollo-server');
const { ApolloServer } = require('apollo-server-express');
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} = require('apollo-server-core');
const { typeDefs } = require('./db/schema.js');
const { resolvers } = require('./db/resolvers.js');
const { decodeToken } = require('./helpers/token.js');
const express = require('express');
const http = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: ({ req }) => {
//     const token = req.headers?.authorization;
//     if (token) {
//       try {
//         const getUser = decodeToken({
//           token: token.replace('Bearer', '').trim(),
//           seed: process.env.JWT_SEED,
//         });
//         return {
//           user: getUser,
//         };
//       } catch (error) {
//         console.log(error.message);
//       }
//     }
//   },
//   csrfPrevention: true,
//   cache: 'bounded',
//   plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
// });

// const PORT = process.env.PORT || 4000;

// server.listen(PORT).then(({ url }) => {
//   console.log(`🚀  Server ready at ${url}`);
// });

// Documentation
// https://www.apollographql.com/docs/apollo-server/v3/data/subscriptions

async function startApolloServer(typeDefs, resolvers, decodeToken) {
  const PORT = process.env.PORT || 4000;
  const WS_PATH = process.env.WS_PATH || '/ws-graphql';

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  const httpServer = http.createServer(app);

  // Creating the WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: WS_PATH,
  });

  // WebSocketServer start listening.
  const serverCleanup = useServer({ schema }, wsServer);

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  const server = new ApolloServer({
    schema,
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
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  // More required logic for integrating with Express
  await server.start();
  server.applyMiddleware({
    app,
    // By default, apollo-server hosts its GraphQL endpoint at the
    // server root. However, *other* Apollo Server packages host it at
    // /graphql. Optionally provide this to match apollo-server.
    path: '/',
  });

  // Modified server startup
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`🚀 Server WS ready at http://localhost:${PORT}${WS_PATH}`);
}

startApolloServer(typeDefs, resolvers, decodeToken);
