const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth.middleware");
const users = require("../data/users");
const router = express.Router();

// 1. Get my profile
router.get("/profile", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

// 2. Change my name
router.put("/profile", authMiddleware, (req, res) => {
  const { name } = req.body;
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name) {
    user.name = name;
  }

  res.json({ message: "Name updated", name: user.name });
});

// // 3. Change password

// router.put("/password", authMiddleware, async (req, res) => {
//   const { currentPassword, newPassword } = req.body;
//   const user = users.find((u) => u.id === req.user.id);

//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   // Check current password
//   const isValid = await bcrypt.compare(currentPassword, user.password);
//   if (!isValid) {
//     return res.status(400).json({ message: "Wrong password" });
//   }

//   // Update to new password
//   user.password = await bcrypt.hash(newPassword, 10);
//   res.json({ message: "Password changed" });
// });

// 4. Get all users (to choose who to share location with)
router.get("/list", authMiddleware, (req, res) => {
  const userList = users
    .filter((u) => u.id !== req.user.id) // Exclude myself
    .map((u) => ({ id: u.id, email: u.email, name: u.name }));

  res.json({ users: userList });
});

module.exports = router;
