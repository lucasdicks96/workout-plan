import { Request, Response, Router } from "express";

const router = Router();

router.post("/create-exercise", (req: Request, res: Response) => {
  console.log(req.body);
  res.status(201).json({
    exercise: { title: req.body.title, description: req.body.description },
  });
});

export default router;
