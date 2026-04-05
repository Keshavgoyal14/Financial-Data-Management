import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { initializeDatabase } from "./db";
import { openApiDocument } from "./docs/openapi";
import { jwtAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { recordsRouter } from "./routes/records";
import { usersRouter } from "./routes/users";

initializeDatabase();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Auth routes (no authentication required)
app.use("/api/auth", authRouter);

// Protected routes (authentication required)
app.use(jwtAuth);
app.use("/api/users", usersRouter);
app.use("/api/records", recordsRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Finance backend running on http://localhost:${port}`);
});
