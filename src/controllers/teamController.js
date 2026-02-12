// import User from "../models/User.js";
// import Account from "../models/Account.js";
// import bcrypt from "bcryptjs";

// export const addTeamMember = async (req, res) => {
//   const owner = req.user; // from auth middleware
//   const { name, email, password } = req.body;

//   if (owner.role !== "owner") {
//     return res.status(403).json({
//       message: "Only owner can add users",
//     });
//   }

//   const account = await Account.findById(owner.accountId);

//   const usersCount = await User.countDocuments({
//     accountId: account._id,
//   });

//   if (usersCount >= account.userLimit) {
//     return res.status(403).json({
//       message: "User limit reached. Upgrade plan.",
//     });
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const member = await User.create({
//     name,
//     email,
//     password: hashedPassword,
//     role: "member",
//     accountId: account._id,
//   });

//   res.json({
//     message: "Team member added",
//     memberId: member._id,
//   });
// };
