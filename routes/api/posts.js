const express=require('express');
const router=express.Router();
const auth=require('../../middleware/auth');
const Post=require('../../models/Post');
const User=require('../../models/User');
const {check, validationResult}=require('express-validator')

//@route         Post api/posts
//@desc          Add new post
//@access        Private
router.post('/',[auth,[
    check("text","Text is required").not().isEmpty()
    ]],
    async (req,res)=>{
        const error=validationResult(req);
        if(!error.isEmpty())
        {
            return res.status(400).json({Errors:error.array()});
        }
        try {
            const postDetails=req.body;
            const user=await User.findOne({_id:req.user.id},"-password")

            postDetails.user=req.user.id;
            postDetails.name=user.name;
            postDetails.avatar=user.avatar;

            const post=await new Post(postDetails);
            await post.save();
            res.json(post);
        } catch (err) {
            console.log(err.message);
            res.status(500).json({msg:"Server Error"});
        }
});


//@route         Get api/posts
//@desc          Get all posts
//@access        Private
router.get('/',auth,async (req,res)=>{
    try {
        const allPosts=await Post.find().sort({date:-1});
        res.json(allPosts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg:"Server Error"});
    }
})


//@route         Get api/posts/:postID
//@desc          Get post by ID
//@access        Private
router.get('/:postID',auth,async (req,res)=>{
    try {
        const post=await Post.findById(req.params.postID);
        if(!post)
        {
            return res.status(404).json({msg:"Post not found"});
        }
        res.json(post);
    } catch (err) {
        if(err.kind=="ObjectId")
        {
            return res.status(404).json({msg:"Invalid Post ID"});
        }
        console.error(err.message);
        res.status(500).json({msg:"Server Error"});
    }
})



//@route         Delete api/posts/:postID
//@desc          Delete post by ID
//@access        Private
router.delete('/:postID',auth,async (req,res)=>{
    try {
        const post=await Post.findById(req.params.postID);
        if(!post)
        {
            return res.status(404).json({msg:"Post not found"});
        }
        if(post.user!=req.user.id)
        {
           return res.status(401).json({msg:"User not authorized"})
        }
        await Post.deleteOne({user:req.user.id});
        res.json({msg:"Post Deleted Successfully"});
    } catch (err) {
        if(err.kind=="ObjectId")
        {
            return res.status(404).json({msg:"Invalid Post ID"});
        }
        console.error(err.message);
        res.status(500).json({msg:"Server Error"});
    }
})


//@route         Like api/posts/like/:postID
//@desc          Like post 
//@access        Private
router.put('/like/:postID',auth,async (req,res)=>{
    try {
        const post=await Post.findById(req.params.postID);
        if(post==null)
        {
            return res.status(404).json({msg:"Post not found"});
        }
        const likeExists = post.likes.some(obj => {
            if(obj.user==req.user.id) return 1;
            return 0;
        });   
     
        if(likeExists)
            return res.status(400).json({msg:"Post is already liked"});
        post.likes.unshift({user:req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (err) {
        if(err.kind=="ObjectId")
        {
            return res.status(404).json({msg:"Invalid Post ID"});
        }
        console.error(err.message);
        res.status(500).json({msg:"Server Error"});
    }
})


//@route         Unlike api/posts/unlike/:postID
//@desc          Unlike post 
//@access        Private
router.put('/unlike/:postID',auth,async (req,res)=>{
    try {
        const post=await Post.findById(req.params.postID);
        if(post==null)
        {
            return res.status(404).json({msg:"Post not found"});
        }
        const indexOfUser = post.likes.findIndex(obj=>{
            if(obj.user==req.user.id) return 1;
            return 0;
        })

     
        if(indexOfUser==-1)
            return res.status(400).json({msg:"Post is not liked"});
        post.likes.splice(indexOfUser,1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        if(err.kind=="ObjectId")
        {
            return res.status(404).json({msg:"Invalid Post ID"});
        }
        console.error(err.message);
        res.status(500).json({msg:"Server Error"});
    }
})



//@route         Comment api/posts/comment/:postID
//@desc          Comment on post 
//@access        Private
router.put('/comment/:postID',[auth,[check("text","Text Required").notEmpty()]],async (req,res)=>{
    const error=validationResult(req);
    if(!error.isEmpty()){
            return res.status(400).json({Errors:error.array()});
        }
    try {
        const post=await Post.findById(req.params.postID);

        if(post==null)
            return res.status(404).json({msg:"Post not found"});

        const user=await User.findById(req.user.id);
        const comment={
            user:req.user.id,
            text:req.body.text,
            name:user.name,
            avatar:user.avatar
        }
        post.comments.push(comment);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        if(err.kind=="ObjectId")   
            return res.status(404).json({msg:"Invalid Post ID"});
        res.status(500).json({msg:"Server Error"});        
    }
})




//@route         Delete api/posts/comment/:postID/:commentID
//@desc          Delete on post 
//@access        Private
router.delete('/comment/:postID/:commentID',auth,async (req,res)=>{
 
    try {
        const post=await Post.findById(req.params.postID);

        if(post==null)
            return res.status(404).json({msg:"Post not found"});

        var commentUser=false;
        const deleteComment=post.comments.findIndex(comment=>{
            if(comment._id==req.params.commentID&&comment.user==req.user.id) commentUser=true;
            if(comment._id==req.params.commentID) return 1;
            return 0;
        });
        if(deleteComment==-1)
            return res.status(404).json({msg:"Comment not found"});
        if(!commentUser)
            return res.status(401).json({msg:"User not authorized"});
        post.comments.splice(deleteComment,1);
        await post.save();
        res.json(post.comments);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind=="ObjectId")   
            return res.status(404).json({msg:"Invalid Post ID"});
        res.status(500).json({msg:"Server Error"});        
    }
})


module.exports=router;