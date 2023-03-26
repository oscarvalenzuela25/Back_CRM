const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

/**
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
const mongoConnection = {
  isConnected: 0,
};

exports.connectDB = async () => {
  if (mongoConnection.isConnected) return;
  if (mongoose.connections.length > 0) {
    mongoConnection.isConnected = mongoose.connections[0].readyState;
    if (mongoConnection.isConnected === 1) return;
    await mongoose.disconnect();
  }

  await mongoose.connect(process.env.MONGO_URL || '');
  console.log('Conectados 👍');
  mongoConnection.isConnected = 1;
};

exports.disconnectDB = async () => {
  if (process.env.NODE_ENV === 'development') return;
  if (mongoConnection.isConnected === 0) return;
  await mongoose.disconnect();
  console.log('Desconectados 👎');
  mongoConnection.isConnected = 0;
};
