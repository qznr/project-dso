import express from "express";
import dotenv from 'dotenv';
import authRoutes from "./src/routes/auth.routes.js";
import threadRoutes from "./src/routes/thread.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import fs from 'fs';
import path from 'path';

const uploadDir = 'uploads';
const profileDir = path.join(uploadDir, 'profiles');
const attachmentDir = path.join(uploadDir, 'attachments');

// Fungsi untuk memastikan direktori ada
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDirExists(profileDir);
ensureDirExists(attachmentDir);
dotenv.config(); 

const app = express();
const port = process.env.PORT || 3000;

// Middleware Global
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Apps2 Backend Running (Express + Prisma)");
});

// ROUTE API
app.use("/api/auth", authRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/users", userRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});