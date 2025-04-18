const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./Models/userSchema');
const UserDetailsModel = require('./Models/userDetailsSchema');
const friendsModel = require('./Models/friendsSchema');
const friendsMessageModel = require('./Models/friendsMessageSchema');
const groupModel =require('./Models/groupsSchema');
const groupMessageModel = require('./Models/groupMessageSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true
}));
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/chat-app");

app.post('/login', async(req, res) => {
    try {
        const { emailorpass, password } = req.body;
        const user =await UserModel.findOne({$or:[{email:emailorpass},{userName:emailorpass}]});
        if(!user){
            return res.status(400).json("user not found");
        }
        const isMatch =await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json("password incorrect");
        }
        const token = jwt.sign({id:user._id},"key",{expiresIn:"7d"});
        return res.status(201).json({ message: "Login successful",token, user });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})       
app.post('/register', async (req, res) => {
    try {
        const { email, userName, password, confirmPassword } = req.body;

        const useremail = await UserModel.findOne({ email }); 
        const user = await UserModel.findOne({ userName });
        if (useremail) {
            return res.status(400).json("email already exist");
        } else if (user) {
            return res.status(400).json("user already exist");
        } else if (password !== confirmPassword) {
            return res.status(400).json("Password didn't match");
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await UserModel.create({ email, userName, password: hashedPassword });

            const token = jwt.sign({id:newUser._id},"key",{expiresIn:"7d"});

            return res.status(201).json({ message: "User registered successfully",token, user: newUser });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

const http = require("http");
const {Server} = require("socket.io");
const server =http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingInterval: 25000,
  pingTimeout: 60000,
})
const connectedUsers = new Map();
io.on('connection',(socket)=>{
    console.log(`User connected: ${socket.id}`);
    socket.on("user", (userName) => {
        socket.userName = userName;
        connectedUsers.set(userName,socket.id);
        console.log(`User ${userName} connected with ID: ${socket.id}`);
        console.log(connectedUsers);
      });

      socket.on("addfrd",async(frdUserName)=>{
        socket.frdUserName =frdUserName;
        const frdName = await UserModel.findOne({userName:frdUserName}) || "null";
        console.log(frdName.userName);
        io.emit("findUser",frdName.userName);
    });
    socket.on("setname",async(name,userName)=>{
        socket.userName = userName;
        const newuser = await UserDetailsModel.findOneAndUpdate(
            {userName:userName},
            {$set:{name:name}},
            {new:true,upsert:true}
        );
        console.log(newuser);
    })
    socket.on("setabout",async(about,userName)=>{
        socket.about=about;
        socket.userName = userName;
        const newuser = await UserDetailsModel.findOneAndUpdate(
            {userName:userName},
            {$set:{about:about}},
            {new:true,upsert:true}
        );
        console.log(newuser);
    })
    socket.on("search",async(name)=>{
        socket.name=name;
        const user = await UserDetailsModel.findOne({userName:name});
        if(user){
        socket.emit("searchFinal",name,user.name,user.about,user.profilePic);
}})
      socket.on("details",async(userName)=>{
        socket.userName =userName;
        const userDetails = await UserDetailsModel.findOne({ userName });

        if (!userDetails) {
            socket.emit("det", userName, "", "");
        } else {
            socket.emit("det", userName, userDetails.name || "", userDetails.about || "");
        }
        console.log(userName);
    });
    socket.on("addfrdbutton",async(user,loggedUser)=>{
        socket.user=user;
        socket.loggedUser = loggedUser;
        const val1 = await friendsModel.findOne({userName:loggedUser}); 
        if(val1){
            await friendsModel.findOneAndUpdate(
            {userName:loggedUser},
            {$addToSet:{friendsName:user}},
            {new:true,upsert:true}
        );
        }else{
            await friendsModel.create({userName:loggedUser,friendsName:[user]})
        }
    });
    socket.on('privatemsg', async(message, user) => {
        const userName = socket.userName; // Get the sender's username
        const receiverId = connectedUsers.get(user); // Get the recipient's socket ID
        const available = friendsModel.find({userName:userName, friendsName:user});
    
        if (available) {
            const newMessage = new friendsMessageModel({
                from:userName,
                to:user,
                message:message,
            })
            await newMessage.save();
            io.to(receiverId).emit('receivedmsg', { from: userName, message }); 

            socket.emit('receivedmsg', { from: userName, message });
    
            console.log(`Message sent from ${userName} to ${user}: ${message}`);
        } else {
            console.log(`Recipient ${user} not found or offline`);
        }
    });
    socket.on('frdName',(frdName)=>{
        socket.emit('frdNamefromserver',frdName);
    })
    socket.on('groupname',async(grpname)=>{
        const group = await groupModel.findOne({groupName:grpname});
        if(group){
            socket.emit('groupmembers',group.members);
            socket.emit('grpnameformsg',group);
        }
    });
    socket.on('groupmsg',async(message,frds,groupName)=>{
        if (!groupName) {
            console.log("Error: groupName is undefined.");
            return;
        }
        const userName = socket.userName;
        const receiverId = [];
        frds.map((frd)=>{
            receiverId.push(connectedUsers.get(frd));
        })
        if(receiverId.length>0){
            const newMessage = new groupMessageModel({
                groupName:groupName,
                from:userName,
                members:frds,
                message:message
            }) 
            await newMessage.save();
            const msgData = { from: userName, message };
            io.to(receiverId).emit('grpmsgoutput',msgData);
            console.log(`Message sent from ${userName} to ${groupName}: ${message}`);
        } else {
            console.log(`Recipient ${groupName} not found or offline`);
        }
    })
    //for settings
    socket.on('changeEmail',async(email)=>{
        const alreadyAvailable = await UserModel.findOne({email:email});
        if(alreadyAvailable){
            return socket.emit('changeEmailAnswer',"Email Already Availlable");
        }else{
            await UserModel.updateOne({userName:socket.userName,email:email});
            socket.emit('changeEmailAnswer',"Success");
        }
    })
    socket.on('changeUsername',async(user)=>{
        const alreadyAvailable = await UserModel.findOne({userName:user});
        if(alreadyAvailable){
            return socket.emit('changeUsernameAnswer',"Username Already Availlable");
        }else{
            await UserModel.updateOne({userName:user});
            socket.emit('changeUsernameAnswer',"Success");
        }
    })
    socket.on('deleteaccount', async (userName) => {
        try {
            console.log(`Delete request received for user: ${userName}`);
            
            const result = await UserModel.deleteOne({ userName: userName });
            await UserDetailsModel.deleteOne({userName:userName});
           const group= await groupModel.deleteOne({createdBy:userName});
            await groupMessageModel.deleteOne({from:userName});
            await friendsMessageModel.deleteOne({$or:[{from:userName},{to:userName}]});
            await friendsModel.updateMany(
                { friendsName: userName },
                { $pull: { friendsName: userName } } 
              );

            if (result.deletedCount > 0) {
                console.log('User deleted successfully:', userName);
                socket.emit('deleteaccountResponse', 'Account deleted successfully');
            } else {
                console.log('User not found or already deleted:', userName);
                socket.emit('deleteaccountResponse', 'User not found');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            socket.emit('deleteaccountResponse', 'Error deleting account');
        }
    });
    socket.on('uploadProfilePic',async(formdata)=>{
        try{
        const {user,profilePic} = formdata;
        const profilePicPath = profilePic.path;
        await UserDetailsModel.findOneAndUpdate(
            { userName: user },
            { $set: { profilePic: profilePicPath } },
            { new: true, upsert: true }
        );

        socket.emit("profilePicUpdated", profilePicPath);
    } catch (err) {
        console.error(err);
        socket.emit("profilePicUpdateError", "Error updating profile picture");
    }
    })
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        connectedUsers.delete(socket.userName);
    });
})
const friendsRouter = require('./Routes/friends');
app.use('/api', friendsRouter);
const groupsRouter = require('./Routes/groups');
app.use('/api', groupsRouter);
const addgroupRouter = require('./Routes/addgroup');
app.use('/api', addgroupRouter);
const uploadProfileRouter = require('./Routes/uploadprofile')
app.use('/api',uploadProfileRouter);

app.get('/api/messages',async(req,res)=>{
    try {
    const {user1,user2} = req.query;
    const messages =await friendsMessageModel.find({
        $or:[
            {from:user1,to:user2},
            {from:user2,to:user1}
        ],
    }).sort({time:1});res.status(200).json(messages);
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
}})
app.get('/api/groupmessages',async(req,res)=>{
    try {
    const {user1,groupName} = req.query;
    if (!groupName) {
        return res.status(400).json({ error: "groupName is required" });
    }
    const messages =await groupMessageModel.find({
        groupName:groupName
    }).sort({time:1}).select("from message");
    res.status(200).json(messages);
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
}})
app.get('/api/userDetails', async (req, res) => {
    try {
        const { user } = req.query;

        const userDetails = await UserDetailsModel.findOne({ userName: user });

        if (userDetails) {
            res.status(200).json({
                profilePic: userDetails.profilePic || null, // Return the profile picture path
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
server.listen(3000, () => {
    console.log(" Server running on http://localhost:3000");
  });