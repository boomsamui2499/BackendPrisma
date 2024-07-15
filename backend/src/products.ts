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

router.get('/show/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

router.put('/update/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { productName, price } = req.body;

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: { productName, price },
  });

  res.json(updatedProduct);
});

router.put('/softDelete/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: { active:0},
  });

  res.json({ message: 'Product softDelete' });
});

router.delete('/delete/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  await prisma.product.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Product delete' });
});

export default router;
