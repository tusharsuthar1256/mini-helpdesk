require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error('Please add MONGO_URI and JWT_SECRET in the .env file');
    }

    await connectDB();

    app.listen(PORT, () => {
      console.log('Server running on http://localhost:' + PORT);
    });
  } catch (error) {
    console.log('Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
