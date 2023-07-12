
const http = require('http');
const express = require('express');
const cors = require('cors')

const { mongodb_connection } = require('./config/db');
const { userRouter } = require('./routes/user.route');

const { joinRoom, formateMessage, getRoomUsers, getCurrentUser,leaveChat } = require('./controllers/user');

const app = express()
const server = http.createServer(app)

app.use(express.json());
app.use(cors());


app.use('/user', userRouter)



const {Server} = require('socket.io');

const io = new Server(server)


io.on('connection', (socket)=>{
    console.log('socket connected');

    socket.on('joinRoom', ( {username, room} ) => {
        const user = joinRoom(socket.id, username, room)
        
        socket.join(user.room)
        console.log(user);

        // Greet to joined user
        socket.emit("message", formateMessage("Admin", `Welcome to the room ${user.username}`))

        // Greet to all users
        socket.broadcast.to(user.room).emit("message", formateMessage("Admin", `${user.username} has joined`))

        // send all users list in a room
        io.to(user.room).emit("roomUsers", {
            room : user.room,
            users : getRoomUsers(user.room)
        })
    })

    socket.on('chatMessage', (msg)=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit("message", formateMessage(user.username, msg))

    })

    socket.on('disconnect', ()=>{
        console.log('socket disconnected');
        const user = leaveChat(socket.id)
        console.log(user);
        io.to(user[0].room).emit("message", formateMessage(user[0].username, "Left chat"))
    })
    
})




const PORT = process.env.PORT || 8080;

server.listen(PORT, async ()=>{
    try {
        await mongodb_connection
        console.log('DB Connected');
    } catch (error) {
        console.log(error.message);
    }
    console.log('Server is running on port ' + PORT);
})