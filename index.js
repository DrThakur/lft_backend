const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDb } = require("./connection");
const ticketRouter = require("./routes/ticket");
const userRouter = require("./routes/user");
const assetRouter = require("./routes/asset");
const conversationRouter = require("./routes/conversation");
const messageRouter = require("./routes/message");
const slaRouter = require("./routes/sla");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const { handleCSVdataToDatabase } = require("./controllers/asset");
const {
  handleUserCSVdataToDatabase,
  handleProfileImageUpload,
  fetchUserIdsByEmails,
} = require("./controllers/user");
const {
  getTicketsByUserId,
  addMembersToTicket,
} = require("./controllers/ticket");
const transporter = require("./services/nodemailerConfig");

const {
  checkForAuthenticationCookie
} = require("./middlewares/authentication");
require("dotenv").config();
const cors = require("cors");
const { Server } = require("socket.io");
const Ticket = require("./models/ticket");

const app = express();
const PORT = 8002;

// Configure CORS to allow requests from your React frontend's origin
// const corsOptions = {
//   origin: "http://localhost:3000", // Replace with the actual origin of your React app
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

app.use(cors());
// Configure CORS to allow requests from your React frontend
// app.use(
//   cors({
//     origin: "http://localhost:3000", // Replace with the actual origin of your React app
//   })
// );

const server = http.createServer(app); // Create an HTTP server
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()} - ${file.originalname}`);
  },
});

//Multer filter
const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.split("/")[1] === "jpeg" ||
    file.mimetype.split("/")[1] === "jpg" ||
    file.mimetype.split("/")[1] === "png" ||
    file.mimetype.split("/")[1] === "csv" ||
    file.mimetype.split("/")[1] ===
      "vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return cb(null, true);
  } else {
    return cb("Not a JPG file", false);
  }
};

// mongodb+srv://drankitkumarthakur:MtcJwiuDf27C4Ny8@cluster0.k8wu6dh.mongodb.net/?retryWrites=true&w=majority
// Connection
// connectToMongoDb("mongodb://127.0.0.1:27017/test").then(() =>
//   console.log("MongoDb Connected!")
// );
connectToMongoDb(
  "mongodb+srv://drankitkumarthakur:Ankit%40258011@cluster0.gfwgbvb.mongodb.net/itmanagement"
).then(() => console.log("MongoDb Connected on Cloud!"));

// View Engine Declaration
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

// MiddleWares
// Serve images from a specific directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); //parse json data middleware
app.use(express.urlencoded({ extended: false })); //parse url-endcoded data middleware
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
//
const upload = multer({ storage: storage, fileFilter: multerFilter });

// // Socket.io communication
// io.on("connection", (socket) => {
//   console.log("A user connected");
//   socket.on("joinRoom", async (roomId) => {
//     socket.join(roomId);

//     // Fetch and emit chat history for the room
//     try {
//       const ticket = await Ticket.findById(roomId);
//       if (ticket) {
//         socket.emit("chatHistory", ticket.chatHistory);
//       }
//     } catch (error) {
//       console.error("Error fetching chat History: ", error);
//     }
//   });

//   socket.on("sendMessage", async ({ roomId, sender, message }) => {
//     // Save the message to the ticket's chat history
//     try {
//       const ticket = await Ticket.findById(roomId);
//       if (ticket) {
//         ticket.chatHistory.push({ sender, message });
//         await ticket.save();
//       }
//     } catch (error) {
//       console.error("Error saving chat message: ", error);
//     }

//     // Broadcast the message to the room
//     io.to(roomId).emit("message", { sender, message });
//   });

//   console.log("connected to socket.io", socket);
// });

// Handle Socket.io connections
io.on("connection", (socket) => {
  console.log(`My User connected: ${socket.id}`);

  // Handle chat messages here
  // socket.on("chatMessage", (message) => {
  //   // You can save the message to MongoDB or handle it as needed
  //   console.log(`Received message from ${socket.id}: ${message}`);
  //   // Broadcast the message to all connected clients (including the sender)
  //   io.emit("chatMessage", message);
  // });

  socket.on("roomConnect", (roomId) => {
    socket.join(roomId);
    console.log("room Id", roomId);
    socket.emit("connected");
  });
  // Handle disconnections
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// // Handle requests on Ticket submission
app.use("/tickets", ticketRouter);

// Handle requests on User
app.use("/users",  userRouter);

// Handle requests on Assets
app.use("/assets", assetRouter);

// Handle requests on Conversation
app.use("/conversations", conversationRouter);

// Handle requests on messages
app.use("/messages", messageRouter);

// Handle request on SLA
app.use("/slas", slaRouter);

// Upload file
app.post("/assets/importFile", upload.single("file"), handleCSVdataToDatabase);
app.post(
  "/users/importFile",
  upload.single("file"),
  handleUserCSVdataToDatabase
);
app.post(
  "/users/uploadProfileImage",
  upload.single("file"),
  handleProfileImageUpload
);
app.get("/ticketByUserId", getTicketsByUserId);

app.post("/addMembersToTicket", async (req, res) => {
  try {
    const { ticketId, newMembers } = req.body;

    console.log("My...tick id", ticketId);
    console.log("My...newmemebers", newMembers);

    const userIds = await fetchUserIdsByEmails(newMembers);

    console.log("My user Ids", userIds);

    // udate ticket with memebers
    const updatedTicket = await addMembersToTicket(ticketId, userIds);

    console.log("My ticket updated", updatedTicket);

    // Send a response with the updated ticket
    res.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error("Error adding members to the ticket:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/send", function (req, res) {
  const { message } = req.body;
  console.log("from, to, message", message);
  const to = "drankitkumarthakur@gmail.com";
  const cc = [
    "kotana5465@twugg.com",
    "dekahi1063@utwoko.com",
    "fojovor117@sesxe.com",
  ];
  // Send an email Notification
  // Function to send an individual email
  const sendIndividualEmail = (recipient) => {
    const mailOptions = {
      from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>', // Sender's email address
      to: recipient, // Receiver's email address
      subject: "Ticket Reply",
      html: `<p>Hello</p>
      <p>A new reply has been posted for the ticket.</p>
      <p>Here is the message:</p>
      ${message}
      <p>Visit the app to view the ticket details.</p>
    `,
    };

    //Transporter Object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  };

  // Send individual emails to 'to' recipients
  sendIndividualEmail(to);

  // Send individual emails to 'cc' recipients
  cc.forEach((recipient) => {
    sendIndividualEmail(recipient);
  });
});

server.listen(PORT, () => console.log(`Server started at PORT : ${PORT}`));
