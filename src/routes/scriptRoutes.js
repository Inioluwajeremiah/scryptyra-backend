const express = require('express');
const router  = express.Router();
const scriptController = require('../controllers/scriptController');
const { protect }      = require('../middleware/auth');
const { validate, scriptRules } = require('../middleware/validate');
const { checkScriptLimit, attachPlanLimits } = require('../middleware/usageLimiter');

router.use(protect);
router.use(attachPlanLimits);

router.route('/')
  .get(scriptController.getScripts)
  .post(scriptRules, validate, checkScriptLimit, scriptController.createScript);

router.route('/:id')
  .get(scriptController.getScript)
  .patch(scriptRules, validate, scriptController.updateScript)
  .delete(scriptController.deleteScript);

router.patch('/:id/archive', scriptController.archiveScript);

module.exports = router;
