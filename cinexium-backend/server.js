import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import historyRoutes from "./src/routes/historyRoutes.js";
import ratingRoutes from "./src/routes/ratingRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import movieRoutes from "./src/routes/movieRoutes.js"
import tvRoutes from "./src/routes/tvRoutes.js"
dotenv.config();

//connect DB
connectDB();

const app = express();

//middleware
app.use(express.json());

//routes
app.use("/api/auth", authRoutes);
//favorites route
app.use("/api/favorites", favoriteRoutes);
//history route
app.use("/api/history", historyRoutes);
//rating route 
app.use("/api/rating", ratingRoutes)
//review route
app.use("/api/reviews", reviewRoutes)
//movie routes
app.use("/api/movies", movieRoutes)
//series routes
app.use("/api/tv", tvRoutes)

app.get("/", (req, res) => {
  res.send("Cinexium Backend is running");
});

//server listen
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port 5000");
});
