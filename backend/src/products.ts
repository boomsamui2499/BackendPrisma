import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

const authenticate = (req:any, res:any, next:any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err:any, decoded:any) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.userId = decoded.userId;
    next();
  });
};

router.post('/add', authenticate, async (req, res) => {
  const { productName, price } = req.body;

  const product = await prisma.product.create({
    data: { productName, price},
  });

  res.status(201).json(product);
});

router.get('/show', authenticate, async (req, res) => {
  const products = await prisma.product.findMany();

  res.json(products);
});

export default router;
