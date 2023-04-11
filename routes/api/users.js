const express=require('express');
const { check, validationResult } = require('express-validator');
const User=require('../../models/User')
const gravatar=require('gravatar');
const bcrypt=require('bcryptjs');
const config=require('config');
const jwt=require('jsonwebtoken');

const router=express.Router();

//@route         POST api/users
//@desc          Register user
//@access        Public
router.post('/',[
    check('name','Name is required').not().isEmpty(),
    check('email','Please include a valid email').isEmail(),
    check('password','Please enter a password with 6 or more characters').isLength({min:6})
],
async (req,res)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }    

    try{
        var {name, email,password }=req.body;
        // console.log(email);

        //checking email already exist or not
        const userExists=await User.findOne({email});
        if(userExists)
        {
            return res.status(400).send('User already exist')
        }

        //Gravatar generation
        const avatar=gravatar.url(email,{s: '200', r: 'pg', d: 'mm'});
        // console.log(avatar);

        //encrypting password
        var salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
        // console.log(password);


        //Adding user to database
        var userDetails = new User({
            name,
            email,
            password,
            avatar
          });   
         await userDetails.save();


        //JWT
        const payload={
            user:{
                id:userDetails.id
            }
        };
        jwt.sign(payload,config.get('jwtSecret'),{expiresIn:360000},(err,token)=>{
            if(err) throw err;
            res.json({token});
        });
        
        // res.send('User registered')
    }
    catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports=router;