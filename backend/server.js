const express = require("express");
const dotenv = require("dotenv");
const path = require("path");  // Importing the path module
const { chats } = require("./data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
dotenv.config();
connectDB();
const app = express();

//
app.use(express.json()); // to accept json data

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// // --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "../client/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "../client", "build" ,"index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// // --------------------------deployment------------------------------

// starting a api route
app.get("/", (req, res) => {
      res.send("API is running..");
   });

app.get("/api/chat", (req, res) => {
  res.send(chats);
});

app.get("/api/chat/:id", (req, res) => {
  //   console.log(req.params.id)
  const singleChat = chats.find((e) => e._id === req.params.id);
  res.send(singleChat);
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  5000,
  console.log(`Server started on the PORT ${PORT}`.white.bold)
);
//setting up socket io with the backend

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

//creating the connection
io.on("connection", (socket) => {
  console.log("connected to the socket.io");

  //connecting the user to its own personal socket where user will send some data and it will get added into the room
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });

  //creating a socket for joing the chat and will take the room id from the frontend
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined the Room" + "  " + room);
  });

  //for typing 
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  //creating a socket for sending a message
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

//for terminating the socket
socket.off("setup", () => {
  console.log("USER DISCONNECTED");
  socket.leave(userData._id);
});
})
