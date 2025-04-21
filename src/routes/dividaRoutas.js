import express from 'express';
import {getDividasController , getDividaController, updateDividaController ,deleteDividaController, createDividaController} from "../controllers/dividaController.js";

const router = express.Router();

router.get('/usuario/:usuarioId', getDividasController);
router.get('/:id', getDividaController);
router.put('/:id', updateDividaController);
router.delete('/:id', deleteDividaController);
router.post('/', createDividaController);

export default router;