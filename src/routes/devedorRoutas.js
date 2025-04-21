import express from 'express';
import {registerController, getDevedorController, getDevedoresByUsuarioController, updateDevedorController ,deleteDevedorController, getDividasByDevedorController} from "../controllers/devedorController.js";

const router = express.Router();

router.post('/register', registerController);
router.get('/:telefone', getDevedorController);
router.get('/usuario/:usuarioId', getDevedoresByUsuarioController);
router.put('/:id', updateDevedorController);
router.delete('/:id', deleteDevedorController);
router.get('/:id/dividas', getDividasByDevedorController);

export default router;
