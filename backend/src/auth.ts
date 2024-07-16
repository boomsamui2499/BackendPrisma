import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: Function
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/signup",
  [
    body("username")
      .isString()
      .withMessage("Username must be a string")
      .isLength({ min: 4, max: 20 })
      .withMessage("Username must be between 4 and 20 characters long"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({ token });
    } catch (error) {
      res.status(400).json({ error: "Failed to sign up user" });
    }
  }
);

router.post(
  "/signin",
  [
    body("username")
      .isString()
      .withMessage("Username must be a string")
      .isLength({ min: 4, max: 20 })
      .withMessage("Username must be between 4 and 20 characters long"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ token });
    } catch (error) {
      res.status(400).json({ error: "Failed to sign in user" });
    }
  }
);

router.post("/signout", (req: Request, res: Response) => {
  res.json({ message: "Sign out successful" });
});

export default router;
