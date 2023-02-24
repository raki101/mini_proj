const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');
const app =express();
const mongoose = require('mongoose');
const moment = require('moment');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const fs = require('fs');
//const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
//SERVER FILES TO SERVER
app.use(express.static('public'));


var d = new Date();
//DATABASE CONNECTION
mongoose.connect("mongodb://localhost:27017/charcordDB");
//SCHEMA
const textSchema = 
{
    RoomName:String,
    UserName:String,
    Message:String,
    Time:String
};

//MODEL
const bot = mongoose.model("chatmsgs",textSchema);

//LISTEN TO SERVER
const server = app.listen('4000',()=>
    console.log("server running"));
    

//SCREENSHOT

var unname,rooom;
var queri = `chat.html?username=${unname}&room=${rooom}`

app.post('/',(req,res)=>{

    var temp = req.body.uu; 
    console.log(temp)
    var npath = "amazing.png"
    const screenshot = takeScreenshot(temp,npath);
    // res.redirect(queri);
})


async function takeScreenshot(url,npath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const screenshot = await page.screenshot({path:npath, fullPage: true });
  await browser.close();
  
  //screenshot saved or not
  if(fs.existsSync(npath)){
    console.log(`screenshot saved in "${npath}" file`)
  }
  else{
    console.log("error failed to take screenshot");
  }
  
  return screenshot;
}




const io = socketio(server);

    
const botname  = 'TOBIBOT';

//ESTABLISH CONNECTION
io.on('connection',socket=>{
    console.log("new WS connection")

    socket.on('joinRoom',({username,room})=>{

        const user = userJoin(socket.id,username,room);
        
        socket.join(user.room);
            //welcome current user
    socket.emit('message',formatMessage(botname,'Welcome to Chatcode'));

        //fetching data
        unname = user.username;
        rooom = user.room;

    //broadcasting when user connects
    socket.broadcast.to(user.room).emit('message',formatMessage(botname,`${user.username} has joined the chat`));
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)

        })    
    })


    //runs when user disconnects
    socket.on('disconnect',()=>{
    
        const user = userLeave(socket.id);
        if(user)
        { 
     io.to(user.room).emit('message',formatMessage(botname,`${user.username} has left the chat`));   
     io.to(user.room).emit('roomUsers',{
        room:user.room,
        users:getRoomUsers(user.room)

    }) 
    }})

    //chat messages
    
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
        //
        //h = formatMessage();
        const it = new bot({
            Message:msg,
            RoomName:user.room,
            UserName:user.username,
            Time:d.toLocaleTimeString()
        })
        it.save();   
    })

})