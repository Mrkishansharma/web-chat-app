const moment = require("moment/moment")

const users = []

const joinRoom = (socketId, username, room) => {
    const user = { id: socketId, username, room }
    users.push(user)

    console.log('all user==>',users);
    
    return user
}

const formateMessage = (username, text ) => {
    return {
        username,
        text,
        time : moment().format("MMMM Do YYYY, h:mm:ss a")
    }
}

const getRoomUsers = (room) => {
    const data =  users.filter(user => user.room === room)
    console.log('room user==>',data);
    return data
}

const getCurrentUser = (socketId) => {
    return users.find((room) => room.id === socketId)
}

const leaveChat = (socketId) => {
    const i = users.findIndex((user)=> user.id === socketId)
    console.log(i);
    return users.splice(i,1)
}

module.exports = {
    joinRoom,
    formateMessage,
    getRoomUsers,
    getCurrentUser,
    leaveChat
}