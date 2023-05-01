const express=require('express');
const auth=require('../../middleware/auth');
const Profile=require('../../models/Profile');
const { check, validationResult } = require('express-validator');
const { default: mongoose } = require('mongoose');
const axios=require('axios');
// const normalize=require('normalize');

const router=express.Router();

//@route         GET api/profile/me
//@desc          Get current user profile
//@access        Private
router.get('/me',auth,async (req,res)=>{
    
    try{
        const profile=await Profile.findOne({user:req.user.id}).populate('user', ['name', 'avatar']);;
        if(!profile){
            res.status(400).json({'msg':'Their is no profile for this user'})
        }

        res.json(profile);
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({'msg':'Server Error'});
    }

});


//@route         Post api/profile
//@desc          Post current user profile setup
//@access        Private
router.post('/',[auth,
    [check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty()]],
    async (req,res)=>{

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }
        
        // destructure the request
        const {
            website,
            skills,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;


        // build a profile
        const profileFields = {
            user: req.user.id,
            website:
            website && website !== ''
                ? website
                : '',
            skills: Array.isArray(skills)
            ? skills
            : skills.split(',').map((skill) => ' ' + skill.trim()),
            ...rest
        };


        // Build socialFields object
        const socialFields = { youtube, twitter, instagram, linkedin, facebook };

        // normalize social fields to ensure valid url
        // for (const [key, value] of Object.entries(socialFields)) {
        // if (value && value.length > 0)
        //     socialFields[key] = normalize(value, { forceHttps: true });
        // }

        // add to profileFields
        profileFields.social = socialFields;

        try{
          let profile= await Profile.findOneAndUpdate({user:req.user.id},
                {$set:profileFields},
                {upsert:true,new:true,setDefaultsOnInsert:true});
                res.json(profile);
        }
        catch(err){
            console.error(err.message);
            res.status(500).json({'msg':'Server Error'});
        }

    });



//@route         Get api/profile
//@desc          Get all users profile
//@access        Public
router.get('/',async(req,res)=>{
    try{
        const profile=await Profile.find().populate('user',["name","avatar"]);
        res.json(profile);}
    catch(err){
        res.status(500).json({msg:"Server Error"});

    }
    
})



//@route         Get api/profile/user/:user_id
//@desc          Get profile by user ID
//@access        Public
router.get('/user/:user_id',async(req,res)=>{
    try{
        // console.log(req.params.user_id);
        const profile=await Profile.findOne({
            user:req.params.user_id
        }).populate('user',["name","avatar"]);
        
        if(profile) res.json(profile);
        else res.status(400).json({"msg":"Profile not found"});
    }
    catch(err){
        // console.error(err);
        if(err.kind=='ObjectId') res.status(400).json({"msg":"Profile not found"});
        else res.status(500).json({msg:"Server Error"});

    }
    
})



//@route         Delete api/profile
//@desc          Delete profile, user and posts
//@access        Private
router.delete('/',auth,async(req,res)=>{
    try{
        //delete profile
        await Profile.findOneAndDelete({user:req.user.id});

        //delete user
        await User.findOneAndDelete({_id:req.user.id});

        res.json({msg:'Deleted successfully'});
    }
    catch(err){
        res.status(500).json({msg:"Server Error"});

    }
    
})


//@route         PUT api/profile/experience
//@desc          Add experience
//@access        Private
router.put('/experience',auth,[
        check("title","Title is required").notEmpty(),
        check("company","Company is required").notEmpty(),
        check("from","From date is required").notEmpty()
    ],
   async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        }=req.body;

        const newExp={
            title,
            company,
            location,
            from,
            to,
            current,
            description
        };

        try {
            const profile=await Profile.findOne({user:req.user.id});

            profile.experience.unshift(newExp);

            await profile.save();
            res.json(profile);

        } catch (err) {
            console.log(err.message);
            res.status(500).json({msg:"Server Error"});
        }

        
});


//@route         DELETE api/profile/experience/:exp_id
//@desc          Delete experience
//@access        Private
router.delete('/experience/:exp_id',auth,async (req,res)=>{
    try {
        const profile=await Profile.findOne({user:req.user.id});

        //remove experience with exp_id ID
       for(var i=0;i<profile.experience.length;i++)
       {
            if(profile.experience[i]._id==req.params.exp_id)
                profile.experience.splice(i--   ,1);
       }
    
        await profile.save();
        res.json(profile);
    } 
    catch (err) {
        console.log(err.message);
        res.status(500).json({msg:"Server Error"});
    }
});





//@route         PUT api/profile/education
//@desc          Add education
//@access        Private
router.put('/education',auth,[
    check("school","School is required").notEmpty(),
    check("degree","Degree is required").notEmpty(),
    check("from","From date is required").notEmpty()
],
async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }=req.body;

    const newEdu={
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    };

    try {
        const profile=await Profile.findOne({user:req.user.id});

        profile.education.unshift(newEdu);

        await profile.save();
        res.json(profile);

    } catch (err) {
        console.log(err.message);
        res.status(500).json({msg:"Server Error"});
    }

    
});


//@route         DELETE api/profile/education/:edu_id
//@desc          Delete education
//@access        Private
router.delete('/education/:edu_id',auth,async (req,res)=>{
try {
    const profile=await Profile.findOne({user:req.user.id});

    //remove education with edu_id ID
   for(var i=0;i<profile.education.length;i++)
   {
        if(profile.education[i]._id==req.params.edu_id)
            profile.education.splice(i--   ,1);
   }

    await profile.save();
    res.json(profile);
} 
catch (err) {
    console.log(err.message);
    res.status(500).json({msg:"Server Error"});
}
});



//@route         Get api/profile/github/:username
//@desc          Get user all repo
//@access        Public
router.get('/github/:username',(req,res)=>{
    try{
        console.log(`https://api.github.com/users/${req.params.username}/repos`);
        axios.get(`https://api.github.com/users/${req.params.username}/repos`).then((response)=>{
            res.json(response.data);
        }).catch((err)=>{
            console.log(err.message);
            res.status(400).json({msg:"Incorrect Username"});
        })
    }
    catch(err)
    {
        res.status(500).json({msg:"Server Error"});
    }
})

module.exports=router;