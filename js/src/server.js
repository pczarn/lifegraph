const { ApolloServer } = require('apollo-server')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const models = require('../models')

const express = require('express');
const path = require('path');
const app = express();
// app.use(express.static(path.join(__dirname, '..', 'static'), { index: 'index.html' }))
// app.listen(process.env.PORT)
// ---
app.use(express.static(join(__dirname, "dist")));

app.use((_, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(process.env.PORT, () => console.log("Listening on port " + process.env.PORT));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { models }
})

server
  .listen()
  .then(({ url }) => console.log('Server is running on localhost:4000'))
