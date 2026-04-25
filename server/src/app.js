import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.use("/api/v1", routes);

if (existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    return res.sendFile(clientIndexPath);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
