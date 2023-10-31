const express = require("express");
const router = express.Router();
const User = require("../models/user");

const {
  getAllUsers,
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
  deleteMultipleUsersByIds,
  getAllUsersByIds,
} = require("../controllers/user");

// Login route
router.get("/login", (req, res) => {
  return res.send("Login Page");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Email", email);
  console.log("Password", password);
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    console.log("My Token", token);
    console.log("Token generated:", token);
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
      })
      .send(token);
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(400).send({ msg: "Incorrect Email or Password" });
  }
  // res.json({ msg: "login data recieved" });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").send("Logout Done");
});

router.get("/usersByIds", getAllUsersByIds);

router
  .route("/")
  .get(getAllUsers)
  .post(createUser)
  .delete(deleteMultipleUsersByIds);
router
  .route("/:id")
  .get(getUserById)
  .patch(updateUserById)
  .delete(deleteUserById);

module.exports = router;

