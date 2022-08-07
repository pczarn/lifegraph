const { gql } = require('apollo-server')

const typeDefs = gql`
  type Node {
    id: ID!
    label: String!
    edges: [Edge!]!
  }

  type Edge {
    id: ID!
    label: String
    from: Node!
    to: Node!
  }

  type Query {
    node(id: ID!): Node!
    allNodes: [Node!]!
    allEdges: [Edge!]!
  }

  type Mutation {
    createNode(
      label: String!
    ): Node!
    updateNode(
      id: ID!
      label: String
    ): Node
    deleteNode(
      id: ID!
    ): DeleteNodePayload

    createEdge(
      fromId: ID!
      toId: ID!
      label: String
    ): Edge!
    updateEdge(
      fromId: ID!
      toId: ID!
      label: String
    ): Edge
    deleteEdge(
      fromId: ID!
      toId: ID!
    ): DeleteEdgePayload
  }

  type DeleteNodePayload {
    ok: Boolean!
  }

  type DeleteEdgePayload {
    ok: Boolean!
  }
`;

module.exports = typeDefs
