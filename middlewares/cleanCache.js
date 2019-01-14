/*
     A middleware function to clear Redis cache
 */
 const { clearAllCache } = require("../services/cache");
 // const QrCode = require('../models/qrCode');
 
 exports.cleanCache = async (req, res, next) => {
   // const qrCode = await QrCode.findById({ _id: req.params.id });
   // if (!qrCode) next();
   // const hashKey = req.route.methods.delete ? qrCode.ownerUUID : req.body.ownerUUID;
   await next();
   // clearCache(hashKey);
   clearAllCache();
 };