const User = require('../models/User');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Order = require('../models/Order');
const { connectDB, disconnectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const { createToken } = require('../helpers/token');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

exports.resolvers = {
  Query: {
    getUser: async (_, __, ctx) => {
      if (!ctx.user) throw new Error('No tienes las credenciales');
      return ctx.user;
    },
    getProducts: async () => {
      try {
        await connectDB();
        const products = await Product.find().lean();
        await disconnectDB();
        return products;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getProduct: async (_, { productId }) => {
      try {
        await connectDB();
        const product = await Product.findById(productId).lean();
        if (!product) throw new Error('No se encontro producto con ese ID');
        await disconnectDB();
        return product;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getClients: async () => {
      try {
        await connectDB();
        const clients = await Client.find();
        return clients;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getClient: async (_, { clientId }, ctx) => {
      try {
        await connectDB();
        const client = await Client.findById(clientId);
        if (!client) throw new Error('No existe cliente asociado a ese ID');
        if (client.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes las credenciales');
        await disconnectDB();
        return client;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getClientsBySeller: async (_, __, ctx) => {
      try {
        await connectDB();
        const user = ctx.user;
        if (!user) throw new Error('Ingrese un token valido');
        const clients = await Client.find({ seller: user._id });
        await disconnectDB();
        return clients;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getOrders: async () => {
      try {
        await connectDB();
        const orders = await Order.find().populate('client');
        await disconnectDB();
        return orders;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getOrdersBySeller: async (_, __, ctx) => {
      try {
        await connectDB();
        const user = ctx.user;
        if (!user) throw new Error('Ingrese un token valido');
        const orders = await Order.find({ seller: user?._id }).populate('client');
        await disconnectDB();
        return orders;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getOrdersByStatus: async (_, { status }, ctx) => {
      try {
        await connectDB();
        const user = ctx.user;
        if (!user) throw new Error('Ingrese un token valido');
        const orders = await Order.find({ status, seller: user._id });
        await disconnectDB();
        return orders;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getOrder: async (_, { orderId }, ctx) => {
      try {
        await connectDB();
        const order = await Order.findById(orderId);
        if (!order) throw new Error('No existe order asociado a ese ID');
        if (order.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permiso para hacer eso');
        await disconnectDB();
        return order;
      } catch (error) {}
    },
    getBestClients: async () => {
      try {
        await connectDB();
        const clients = await Order.aggregate([
          { $match: { status: 'PENDING' } },
          {
            $group: {
              _id: '$client',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'client',
              localField: '_id',
              foreignField: '_id',
              as: 'client',
            },
          },
          {
            $sort: { total: -1 },
          },
        ]);
        await disconnectDB();
        return clients;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    getBestSellers: async () => {
      try {
        await connectDB();
        const sellers = await Order.aggregate([
          { $match: { status: 'SUCCESS' } },
          {
            $group: {
              _id: '$seller',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'user',
              localField: '_id',
              foreignField: '_id',
              as: 'seller',
            },
          },
          {
            $sort: { total: -1 },
          },
        ]);
        await disconnectDB();
        return sellers;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    searchProduct: async (_, { text }) => {
      try {
        await connectDB();
        const products = await Product.find({ $text: { $search: text } });
        await disconnectDB();
        return products;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password, adminSecret } = input || {};
      try {
        await connectDB();
        if (process.env.ADMIN_SECRET !== adminSecret) {
          throw new Error('El token de administrador es invalido');
        }
        const findUser = await User.findOne({ email });
        if (findUser) throw new Error('El usuario ya esta registrado');

        const user = new User(input);
        const newPassword = await bcrypt.hash(password, 10);
        user.password = newPassword;
        await user.save();
        await disconnectDB();
        return user;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    authUser: async (_, { input }) => {
      const { email, password } = input;
      try {
        await connectDB();
        const findUser = await User.findOne({ email });
        if (!findUser) {
          throw new Error('No existe un usuario con ese email');
        }
        const verifyPassword = await bcrypt.compare(password, findUser.password);
        if (!verifyPassword) {
          throw new Error('Password erronea');
        }

        const token = createToken({
          user: findUser,
          seed: process.env.JWT_SEED,
          expiresIn: '24h',
        });

        await disconnectDB();
        return {
          token,
        };
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    newProduct: async (_, { input }) => {
      const { price, stock } = input;
      if (price < 0 || stock < 0) {
        throw new Error('Solamente valores positivos');
      }
      try {
        await connectDB();
        const newProduct = new Product(input);
        await newProduct.save();
        await disconnectDB();
        pubsub.publish('PRODUCT_CREATED', { productCreated: newProduct });
        return newProduct;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    updateProduct: async (_, { productId, input }) => {
      try {
        await connectDB();
        const product = await Product.findByIdAndUpdate(productId, input, { new: true });
        if (!product) throw new Error('Producto no encontrado');
        await disconnectDB();
        return product;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    deleteProduct: async (_, { productId }) => {
      try {
        await connectDB();
        const productRemoved = await Product.findByIdAndRemove(productId);
        if (!productRemoved) throw new Error('Producto no encontrado');
        return !!productRemoved;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    newClient: async (_, { input }, ctx) => {
      try {
        await connectDB();
        const client = await Client.findOne({ email: input.email });
        if (client) throw new Error('El cliente ya se encuentra registrado');
        const user = ctx?.user;
        if (!user) throw new Error('Ingrese un token valido');
        const newClient = new Client({ ...input, seller: user._id });
        await newClient.save();
        await disconnectDB();
        return newClient;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    updateClient: async (_, { clientId, input }, ctx) => {
      try {
        await connectDB();
        let client = await Client.findById(clientId);
        if (!client) throw new Error('No se encontro cliente asociado a esa ID');
        if (client.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permisos para hacer eso');
        const updateClient = await Client.findByIdAndUpdate(clientId, input, { new: true });
        await disconnectDB();
        return updateClient;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    deleteClient: async (_, { clientId }, ctx) => {
      try {
        await connectDB();
        const client = await Client.findById(clientId);
        if (!client) throw new Error('No se encontro cliente asociado a ese ID');
        if (client.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permiso para hacer eso');
        const isClientDestroy = await Client.findByIdAndRemove(clientId);
        await disconnectDB();
        return !!isClientDestroy;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    newOrder: async (_, { input }, ctx) => {
      try {
        await connectDB();
        const client = await Client.findById(input.client);
        if (!client) throw new Error('No se encontro cliente asociado a ese ID');
        if (client.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permiso para hacer eso');

        if (!input.products.length) throw new Error('Necesita al menos 1 producto');

        for await (const orderDetail of input.products) {
          const product = await Product.findById(orderDetail.id);
          if (!product) {
            throw new Error('No existe producto asociado a ese ID');
          }
          if (product.stock < orderDetail.quantity) {
            throw new Error(`La cantidad de un producto excede al maximo en stock`);
          }
          product.stock = product.stock - orderDetail.quantity;
          await product.save();
        }

        const order = new Order({ ...input, seller: ctx.user._id, status: 'PENDING' });
        await order.save();
        const findOrder = await Order.findById(order._id).populate('client');
        await disconnectDB();
        return findOrder;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    updateOrder: async (_, { orderId, input }, ctx) => {
      try {
        await connectDB();
        const order = await Order.findById(orderId);
        if (!order) throw new Error('No existe orden asociada a ese ID');
        if (order.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permisos para eso');

        if (input.products) {
          for await (const orderDetail of input.products) {
            const product = await Product.findById(orderDetail.id);
            if (!product) {
              throw new Error('No existe producto asociado a ese ID');
            }
            if (product.stock < orderDetail.quantity) {
              throw new Error(`La cantidad un producto excede al maximo en stock`);
            }
            product.stock = product.stock - orderDetail.quantity;
            await product.save();
          }
        }

        const updatedOrder = await Order.findOneAndUpdate({ _id: orderId }, input, {
          new: true,
        }).populate('client');
        await disconnectDB();
        return updatedOrder;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
    deleteOrder: async (_, { orderId }, ctx) => {
      try {
        await connectDB();
        const order = await Order.findById(orderId);
        if (!order) throw new Error('No existe orden asociada a ese ID');
        if (order.seller.toString() !== ctx?.user?._id)
          throw new Error('No tienes permisos para eso');
        const orderDeleted = await Order.findByIdAndRemove(orderId);
        await disconnectDB();
        return !!orderDeleted;
      } catch (error) {
        console.log(error.message);
        await disconnectDB();
        return error;
      }
    },
  },
  Subscription: {
    productCreated: {
      subscribe: () => pubsub.asyncIterator('PRODUCT_CREATED', (payload) => payload),
    },
  },
};
