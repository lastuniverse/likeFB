var router = require('../lib/router.js');

// middleware that is specific to this router
router.use( function (req, res, next) {
  console.log('test router 1:', res.message );
  res.broadcast();
  next();
});


module.exports = router;
