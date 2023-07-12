
const { Router } = require('express');
const bcrypt = require('bcrypt');
const Mailer = require("nodemailer");
const jwt = require('jsonwebtoken')

require('dotenv').config()

const { UserModel } = require('../models/user.model');

const userRouter = Router()

userRouter.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const isPresent = await UserModel.findOne({ email });
        if (isPresent) {
            return res.status(400).send({
                message: 'User already exists',
                isError: true
            })
        }

        const hashPassword = bcrypt.hashSync(password, 5);
        const user = new UserModel({
            name, email, password: hashPassword
        })
        await user.save();

        console.log('user data save in db');

        const result = await sendMailForVerification(name, email, user._id);

        console.log("result : " , result);

        if(result){

            return res.status(200).send({
                message: 'User registered successfully.(kindly verify your email)',
                isError: false
            })

        }else{

            await UserModel.findByIdAndDelete({_id : user._id});

            return res.status(500).send({
                message: 'Something went wrong while sending email',
                isError: true
            })

        }


    } catch (error) {
        return res.status(500).send({
            message: error.message,
            isError: true
        })
    }
})


function sendMailForVerification(name, email, userId) {
    console.log(process.env.NODEMAILER_PASSWORD);
    // return true

    var transportar = Mailer.createTransport({
        service: "gmail",
        auth: {
            user: "kishansharma6377@gmail.com",
            pass: process.env.NODEMAILER_PASSWORD
        },
    });


    const token  = jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn : "1h" } )

    const backendUrl = 'http://localhost:8080'

    var mailOptions = {
        from: "kishansharma6377@gmail.com",
        to: email,
        subject: "Email Verification",
        html: `<h1>Welcome ${name}</h1>
                <p>
                    Kindly click
                    <a href="${backendUrl}/user/verifyEmail?token=${token}"> here </a> 
                    to verify your email
                </p>
                <p> This link is expire in 1 hour. </p>`
    };

    console.log(mailOptions);

    return new Promise((resolve, reject) => {
        transportar.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error.message);
                reject(false)
            }else{
                console.log(info);
                resolve(true)
            }
        });
    })
    

}


userRouter.get('/verifyEmail', async (req,res)=>{
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        if(decoded){

            await UserModel.findByIdAndUpdate({ _id : decoded.userId }, {
                isVerified : true
            })

            return res.status(200).send(`
                <h1> Your Email is verified </h1>
                <p> Now You are able to login </p>
            `);

        }else{

            return res.status(200).send(`
                <h1> Something Went Wrong </h1>
            `);

        }
    } catch (error) {
        return res.status(500).send(`
            <h1> ${error.message} </h1>
        `)
    }
})


userRouter.post('/login', async (req, res) => {
    const {email, password } = req.body;
    try {
        const userPresent = await UserModel.findOne({ email });
        if(!userPresent){
            return res.status(400).send({
                message : 'User not found',
                isError : true
            })
        }
        if(!userPresent.isVerified){
            return res.status(400).send({
                message : 'Please verify your email',
                isError : true
            })
        }
        const isMatch = bcrypt.compareSync(password, userPresent.password);
        if(!isMatch){
            return res.status(400).send({
                message : 'Invalid Password',
                isError : true
            })
        }
        const token = jwt.sign({ userId : userPresent._id }, process.env.SECRET_KEY, { expiresIn : "24h" })
        return res.status(200).send({
            message : 'Login Successful',
            token : token,
            isError : false,
            username : userPresent.name
        })
    } catch (error) {
        return res.status(500).send({
            message : error.message,
            isError : true
        })
    }
})


userRouter.get('/', async (req,res)=>{
    try {
        const data = await UserModel.find()
        res.send({data})
    } catch (error) {
        res.send({error : error.message})
    }
})


module.exports = {
    userRouter
}