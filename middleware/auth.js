const config=require('config');
const jwt=require('jsonwebtoken');


module.exports=async (req,res,next)=>{
    const token=req.header('x-auth-token');

    if(!token){
       return res.status(401).json({msg:'No token, authorization denied'});
    }

    try{
        var decoded=await jwt.verify(token, config.get("jwtSecret"));

        req.user=decoded.user;
        // console.log(req.user);
        next();
    }
    catch(err){
        console.error(err);
        return res.status(401).json({msg:'Invalid token'});
    }
}