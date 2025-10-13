import express from "express";
import pkg from "pg";
const { Client } = pkg;

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  host: process.env.DB_HOST || "db_postgres",
  user: process.env.DB_USER || "app2_user",
  password: process.env.DB_PASSWORD || "testpass",
  database: process.env.DB_NAME || "app2_db",
});

client
  .connect()
  .then(() => console.log(" Connected to PostgreSQL"))
  .catch((err) => console.error("DB connection failed:", err.message));

// Routes
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/scm", (req, res) => {
  res.send("SCM is working!");
});

app.get("/db", async (req, res) => {
  try {
    const result = await client.query("SELECT NOW() AS now");
    res.send(`DB connected! Server time: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send(`DB query failed: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
