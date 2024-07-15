import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRouter from './auth';
import productRouter from './products';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/auth', authRouter);
app.use('/products', productRouter);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
