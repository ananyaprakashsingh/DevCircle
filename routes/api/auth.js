const express=require('express');

const router=express.Router();

const auth=require('../../middleware/auth');
const User=require('../../models/User');
const jwt=require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const bcrypt=require('bcryptjs');
const config=require('config');




//@route         GET api/auth
//@desc          Test route
//@access        Public
router.get('/',auth,async (req,res)=>{
    // res.send('Auth route');
    // console.log(req.user);
    const userDetails= await User.findById(req.user.id);
    res.json(userDetails);

});



//@route         POST api/auth
//@desc          Login user
//@access        Public
router.post('/',[
    check('email','Please include a valid email').isEmail(),
    check('password','Password required').exists()
],
async (req,res)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }    

    try{
        var { email,password }=req.body;
        // console.log(email);

        //checking email already exist or not
        const user=await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({'msg':'Invalid Credentials'});
        }

        //Verify Password
        const passwordVerified=await bcrypt.compare(password,user.password);
        if(!passwordVerified)
        {
            return res.status(400).json({'msg':'Invalid Credentials'});
        }


        //JWT
        const payload={
            user:{
                id:user.id
            }
        };
        jwt.sign(payload,
            config.get('jwtSecret'),    
            {expiresIn:360000},
            (err,token)=>{
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