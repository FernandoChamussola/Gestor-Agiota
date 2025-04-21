import express from 'express';
import { controladorPagamento } from "../controllers/pagamentoController.js";

const router = express.Router();

router.get('/divida/:dividaId', controladorPagamento.buscarPagamentosPorDivida.bind(controladorPagamento));
router.get('/:pagamentoId', controladorPagamento.buscarPagamentoPorId.bind(controladorPagamento));
router.put('/:pagamentoId', controladorPagamento.atualizarPagamento.bind(controladorPagamento));
router.delete('/:pagamentoId', controladorPagamento.removerPagamento.bind(controladorPagamento));
router.post('/', controladorPagamento.criarPagamento.bind(controladorPagamento));

export default router;
