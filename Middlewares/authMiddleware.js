const jwt = require("jsonwebtoken");

const authMiddleware = (req,res,next)=>{
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access Denied" });

    try{
        const verified = jwt.verify(token.replace("Bearer ",""),"key");
        req.user=verified;
        next();
    }catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
}

module.exports = authMiddleware;