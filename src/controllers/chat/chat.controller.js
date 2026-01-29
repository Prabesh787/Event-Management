import expressAsyncHandler from "express-async-handler";
import { Chat } from "../../models/chat/chatModel.js";
import { User } from "../../models/auth/user.model.js";

export const accessChat = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId not provided with request");
    return res.sendStatus(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.userId } } }, // FIXED
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    return res.send(isChat[0]);
  }

  try {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.userId, userId], // FIXED
    };

    const createdChat = await Chat.create(chatData);

    const fullChat = await Chat.findById(createdChat._id).populate(
      "users",
      "-password"
    );

    return res.status(200).send(fullChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const fetchChat = expressAsyncHandler(async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.userId } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(chats);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const createGroup = expressAsyncHandler(async (req, res) => {
  const { users: usersRaw, name } = req.body;

  if (!usersRaw || !name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  const users = JSON.parse(usersRaw);

  if (users.length < 2) {
    return res.status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.userId);

  try {
    const groupChat = await Chat.create({
      chatName: name,
      users,
      isGroupChat: true,
      groupAdmin: req.userId,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

export const renameGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  res.json(updatedChat);
});

export const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updated) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  res.json(updated);
});

export const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updated) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  res.json(updated);
});
