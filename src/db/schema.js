const { gql } = require('apollo-server');

// Schema
exports.typeDefs = gql`
  ##### Types ######
  type User {
    _id: ID
    name: String
    lastname: String
    email: String
    createdAt: String
  }

  type Token {
    token: String
  }

  type Product {
    _id: ID
    name: String
    stock: Int
    price: Int
    createdAt: String
  }

  type Client {
    _id: ID
    name: String
    lastname: String
    business: String
    email: String
    phone: String
    createdAt: String
    seller: ID
  }

  type Order {
    _id: ID
    products: [OrderDetail]
    total: Float
    client: Client
    seller: ID
    status: OrderStatus
    createdAt: String
  }

  type OrderDetail {
    id: ID
    name: String
    price: Float
    quantity: Int
  }

  type TopClient {
    total: Float
    client: [Client]
  }

  type TopSeller {
    total: Float
    seller: [User]
  }

  ##################

  ##### Inputs ######
  input UserInput {
    name: String
    lastname: String
    email: String
    password: String
    adminSecret: String!
  }

  input AuthInput {
    email: String
    password: String
  }

  input ProductInput {
    name: String
    stock: Int
    price: Int
  }

  input ClientInput {
    name: String
    lastname: String
    business: String
    email: String
    phone: String
  }

  input OrderProductInput {
    id: ID
    name: String
    price: Float
    quantity: Int
  }

  input OrderInput {
    products: [OrderProductInput]
    total: Float
    client: ID
    status: OrderStatus
  }

  enum OrderStatus {
    PENDING
    SUCCESS
    REJECTED
  }
  ##################

  type Query {
    ##### Users
    getUser: User
    #####

    ##### Products
    getProducts: [Product]
    getProduct(productId: ID): Product
    #####

    ##### Clients
    getClients: [Client]
    getClient(clientId: ID): Client
    getClientsBySeller: [Client]
    #####

    ##### Order
    getOrders: [Order]
    getOrdersBySeller: [Order]
    getOrdersByStatus(status: OrderStatus): [Order]
    getOrder(orderId: ID): Order
    #####

    ##### Busquedas
    getBestClients: [TopClient]
    getBestSellers: [TopSeller]
    searchProduct(text: String): [Product]
    #####
  }

  type Mutation {
    ##### Users
    newUser(input: UserInput): User
    authUser(input: AuthInput): Token
    #####

    ##### Products
    newProduct(input: ProductInput): Product
    updateProduct(productId: ID, input: ProductInput): Product
    deleteProduct(productId: ID): Boolean
    #####

    ##### Clients
    newClient(input: ClientInput): Client
    updateClient(clientId: ID, input: ClientInput): Client
    deleteClient(clientId: ID): Boolean
    #####

    ##### Orders
    newOrder(input: OrderInput): Order
    updateOrder(orderId: ID, input: OrderInput): Order
    deleteOrder(orderId: ID): Boolean
    #####
  }

  type Subscription {
    productCreated: Product
  }
`;
