import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { body, validationResult, param } from "express-validator";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
  };
}

const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user as { userId: number };
    next();
  });
};
const validationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
router.post(
  "/add",
  authenticate,
  [
    body("productName").isString().withMessage("Name must be a string"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a number greater than 0"),
  ],
  validationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const { productName, price } = req.body;

    try {
      const product = await prisma.product.create({
        data: {
          productName,
          price,
        },
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to create product" });
    }
  }
);

router.get("/show", authenticate, async (req, res) => {
  const products = await prisma.product.findMany();

  res.json(products);
});
router.get(
  "/show/:id",
  authenticate,
  param("id").isInt().withMessage("ID must be an integer"),
  validationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  }
);
router.put(
  "/update/:id",
  authenticate,
  [
    param("id").isInt().withMessage("ID must be an integer"),

    body("productName").isString().withMessage("Name must be a string"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a number greater than 0"),
  ],
  validationErrors,

  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { productName, price } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { productName, price },
    });

    res.json(updatedProduct);
  }
);

router.delete(
  "/delete/:id",
  authenticate,
  param("id").isInt().withMessage("ID must be an integer"),
  validationErrors,
  async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.update({
      where: { id: parseInt(id) },
      data: { active: 0 },
    });

    res.json({ message: "Product delete" });
  }
);
export default router;
