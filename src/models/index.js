import User from "./user.js";
import Friend from "./friend.js";
import Chat from "./chat.js";

// Friend relationships
User.hasMany(Friend, { foreignKey: "user_id", as: "sentRequests" });
User.hasMany(Friend, { foreignKey: "friend_id", as: "receivedRequest" });
Friend.belongsTo(User, { foreignKey: "id", as: "requester" });
Friend.belongsTo(User, { foreignKey: "id", as: "receiver" });

// Chat relationships
User.hasMany(Chat, { foreignKey: "sender_id", as: "chatSender" });
User.hasMany(Chat, { foreignKey: "receiver_id", as: "chatReceiver" });
Chat.belongsTo(User, { foreignKey: "sender_id", as: "chatSendOwner" });
Chat.belongsTo(User, { foreignKey: "receiver_id", as: "chatReceiveOwner" });

export default { User, Friend, Chat };
