import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use("/pages", express.static("pages"));

// Connect to local MongoDB
await mongoose
  .connect(
    "mongodb+srv://MoiSpace:MoiSpaceX@moispace.h6uhw7s.mongodb.net/MoiSpace?retryWrites=true&w=majority"
  )
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log("Database Failed", err));

// MongoDB Schemas
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gallaryLinks: String,
    profileLink: String,
    aboutMe: String,
    aboutYou: String,
    course: String,
    year: String,
    slogan: String,
    online: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const messageL = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  time: String,
  read: { type: Boolean, default: false },
});

const interestSchema = new mongoose.Schema({
  from: String,
  to: String,
  status: String,
  time: String,
});

const commentsLbl = new mongoose.Schema({
  from: String,
  to: String,
  comment: String,
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  time: String,
});

const followersLbl = new mongoose.Schema({
  from: String,
  to: String,
});

const viewsLbl = new mongoose.Schema({
  viewedUser: { type: String, required: true },
  whoViewed: { type: [String], default: [] },
  viewsCount: { type: Number, default: 0 },
});

let settingsL = new mongoose.Schema({
  totalOnline: { type: Number, default: 0 },
  appState: { type: Boolean, default: true },
});

// Models
const userModel = mongoose.model("Users", userSchema);
const Messages = mongoose.model("Messages", messageL);
const interests = mongoose.model("Interests", interestSchema);
const comments = mongoose.model("Comments", commentsLbl);
const followers = mongoose.model("Followers", followersLbl);
const views = mongoose.model("Views", viewsLbl);
let settings = mongoose.model("criticalSettings", settingsL);

// Socket.IO local server
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("sendMessage", async (msg) => {
    // Save to local MongoDB
    await Messages.create({
      from: msg.from,
      to: msg.to,
      text: msg.msg,
      time: `${new Date().getHours()}:${new Date().getMinutes()}`,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
app.post("/appState", async (req, res) => {
  const { appState } = req.body;
  const updatedSettings = await settings.findOneAndUpdate(
    {},
    { appState },
    { upsert: true, new: true }
  );

  console.log("App state updated:", updatedSettings.appState);

  res.json({ success: true, appState: updatedSettings.appState });
});

app.get("/onlineUsers", async (req, res) => {
  let data = await settings.findOne({});
  res.json({ onlineUsers: data.totalOnline });
  console.log(data);
});

app.get("/everyone", async (req, res) => {
  let data = await userModel.find();
  res.json({ info: data });
});
server.listen(3000, () => {
  console.log("server started");
});
