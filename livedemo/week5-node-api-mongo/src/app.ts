import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import api from "./api/index.js";
import docs from "./docs.js";
import homePage from "./home.js";
import * as middlewares from "./middlewares.js";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(homePage);
});

app.use("/api/v1", api);
app.use("/api-docs", docs);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
