const express = require("express");
const {
  allMessages,
  sendMessage,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
// this route is used for fetching the message

router.route("/:chatId").get(protect, allMessages);

// this route is for sending the message 
router.route("/").post(protect, sendMessage);

module.exports = router;