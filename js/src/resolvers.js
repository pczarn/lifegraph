const { Op } = require('sequelize')

const resolvers = {
  Query: {
    async node(root, { id }, { models }) {
      return models.Node.findByPk(id)
    },
    async allNodes(root, args, { models }) {
      return models.Node.findAll()
    },
    async allEdges(root, args, { models }) {
      return models.Edge.findAll()
    }
  },
  Mutation: {
    async createNode(root, { label }, { models }) {
      return models.Node.create({
        label
      })
    },
    async updateNode(root, { id, label }, { models }) {
      const node = await models.Node.findByPk(id)
      if (node === null) {
        return { ok: false }
      }
      node.label = label
      await node.save()
      return node
    },
    async deleteNode(root, { id }, { models }) {
      const node = await models.Node.findByPk(id)
      if (node === null) {
        return { ok: false }
      }
      await node.destroy()
      return { ok: true }
    },
    async createEdge(root, { fromId, toId, label }, { models }) {
      return models.Edge.create({
        fromId,
        toId,
        label
      })
    },
    async updateEdge(root, { fromId, toId, label }, { models }) {
      const edge = await models.Edge.findOne({
        where: {
          [Op.or]: [
            {
              fromId,
              toId
            },
            {
              fromId: toId,
              toId: fromId,
            }
          ]
        }
      })
      if (edge === null) {
        return null
      }
      edge.label = label
      await edge.save()
      return edge
    },
    async deleteEdge(root, { id }, { models }) {
      const edge = await models.Edge.findOne({
        where: {
          [Op.or]: [
            {
              fromId,
              toId
            },
            {
              fromId: toId,
              toId: fromId,
            }
          ]
        }
      })
      if (edge === null) {
        return { ok: false }
      }
      await edge.destroy()
      return { ok: true }
    },
  },
  Node: {
    async edges(node, args, { models }) {
      return await models.Edge.findAll({
        where: {
          [Op.or]: [
            { fromId: node.id },
            { toId: node.id }
          ]
        }
      })
    }
  },
  Edge: {
    async from(edge, args, { models }) {
      return edge.getFrom()
    },
    async to(edge, args, { models }) {
      return edge.getTo()
    }
  }
}

module.exports = resolvers
