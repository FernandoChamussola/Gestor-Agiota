import { PrismaClient } from '@prisma/client';
import { registerPagamento, getPagamentos, deletePagamento } from '../model/pagamentoModel.js';

const prisma = new PrismaClient();

class ControladorPagamento {
  async criarPagamento(req, res) {
    try {
      const { dividaId, valorPagamento } = req.body;

      if (!dividaId || !valorPagamento) {
        return res.status(400).json({ error: 'Campos obrigatórios: dividaId e valorPagamento' });
      }

      if (valorPagamento <= 0) {
        return res.status(400).json({ error: 'O valor do pagamento deve ser maior que zero' });
      }

      const divida = await prisma.divida.findUnique({
        where: { id: dividaId }
      });

      if (!divida) {
        return res.status(404).json({ error: 'Dívida não encontrada' });
      }

      const pagamento = await registerPagamento({ dividaId, valorPagamento });

      await this.verificarStatusDivida(dividaId);

      return res.status(201).json(pagamento);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      return res.status(500).json({ error: 'Erro ao processar o pagamento' });
    }
  }

  async buscarPagamentosPorDivida(req, res) {
    try {
      const { dividaId } = req.params;

      if (!dividaId) {
        return res.status(400).json({ error: 'ID da dívida é obrigatório' });
      }

      const divida = await prisma.divida.findUnique({
        where: { id: dividaId }
      });

      if (!divida) {
        return res.status(404).json({ error: 'Dívida não encontrada' });
      }

      const pagamentos = await getPagamentos(dividaId);
      
      const totalPago = pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);

      return res.status(200).json({
        pagamentos,
        totalPago,
        valorRestante: divida.valorInicial - totalPago
      });
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
  }

  async removerPagamento(req, res) {
    try {
      const { pagamentoId } = req.params;

      if (!pagamentoId) {
        return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
      }

      const pagamentoExistente = await prisma.pagamento.findUnique({
        where: { id: pagamentoId },
        include: { divida: true }
      });

      if (!pagamentoExistente) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      const pagamentoDeletado = await deletePagamento(pagamentoId);

      await this.verificarStatusDivida(pagamentoExistente.dividaId);

      return res.status(200).json({ 
        message: 'Pagamento removido com sucesso',
        pagamento: pagamentoDeletado
      });
    } catch (error) {
      console.error('Erro ao remover pagamento:', error);
      return res.status(500).json({ error: 'Erro ao remover pagamento' });
    }
  }

  async atualizarPagamento(req, res) {
    try {
      const { pagamentoId } = req.params;
      const { valor, data } = req.body;

      if (!pagamentoId) {
        return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
      }

      const pagamentoExistente = await prisma.pagamento.findUnique({
        where: { id: pagamentoId },
        include: { divida: true }
      });

      if (!pagamentoExistente) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      if (valor !== undefined && valor <= 0) {
        return res.status(400).json({ error: 'O valor do pagamento deve ser maior que zero' });
      }

      const pagamentoAtualizado = await prisma.pagamento.update({
        where: { id: pagamentoId },
        data: {
          ...(valor !== undefined && { valor }),
          ...(data !== undefined && { data: new Date(data) })
        }
      });

      await this.verificarStatusDivida(pagamentoExistente.dividaId);

      return res.status(200).json(pagamentoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      return res.status(500).json({ error: 'Erro ao atualizar pagamento' });
    }
  }

  async verificarStatusDivida(dividaId) {
    try {
      const divida = await prisma.divida.findUnique({
        where: { id: dividaId }
      });

      if (!divida) {
        console.error('Dívida não encontrada para atualização de status');
        return;
      }

      const pagamentos = await getPagamentos(dividaId);
      const totalPago = pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);

      let novoStatus = divida.status;
      
      if (totalPago >= divida.valorInicial) {
        novoStatus = 'QUITADA';
      } 
      else if (divida.dataVencimento < new Date() && divida.status !== 'QUITADA') {
        novoStatus = 'ATRASADA';
      }
      else if (totalPago > 0 && totalPago < divida.valorInicial && divida.dataVencimento >= new Date()) {
        novoStatus = 'ATIVA';
      }

      if (novoStatus !== divida.status) {
        await prisma.divida.update({
          where: { id: dividaId },
          data: { status: novoStatus }
        });
      }

      //await this.atualizarCapitalUsuario(divida.usuarioId);

    } catch (error) {
      console.error('Erro ao verificar status da dívida:', error);
    }
  }

  async atualizarCapitalUsuario(usuarioId) {
    try {
      const dividas = await prisma.divida.findMany({
        where: { 
          usuarioId,
          status: { in: ['ATIVA', 'ATRASADA'] }
        },
        include: {
          pagamentos: true
        }
      });

      let capitalTotal = 0;
      
      for (const divida of dividas) {
        const totalPagamentos = divida.pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);
        
        const valorRestante = divida.valorInicial - totalPagamentos;
        
        capitalTotal += valorRestante;
      }

      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { capitalTotal }
      });

    } catch (error) {
      console.error('Erro ao atualizar capital do usuário:', error);
    }
  }

  async buscarPagamentoPorId(req, res) {
    try {
      const { pagamentoId } = req.params;

      if (!pagamentoId) {
        return res.status(400).json({ error: 'ID do pagamento é obrigatório' });
      }

      const pagamento = await prisma.pagamento.findUnique({
        where: { id: pagamentoId },
        include: { divida: true }
      });

      if (!pagamento) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      return res.status(200).json(pagamento);
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      return res.status(500).json({ error: 'Erro ao buscar detalhes do pagamento' });
    }
  }
}

const controladorPagamento = new ControladorPagamento();

export { controladorPagamento };