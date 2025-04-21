import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function getDividas(usuarioId) {
  try {
      const dividas = await prisma.divida.findMany({
        where: {
          usuarioId: usuarioId  // Correto: o campo usuarioId recebe o valor
        },
        include: {
          devedor: true
        }
      });
      return dividas;
  } catch (error) {
      console.error('Erro ao buscar dívidas:', error);
      throw error;  // Melhor lançar o erro para tratá-lo no controller
  }
}

async function getDivida(dividaId) {
  try {
    const divida = await prisma.divida.findUnique({
      where: {
        id: dividaId,
      },
      include: {
        devedor: true,
      },
    });
    if (!divida) {
      throw new Error('Dívida não encontrada');
    }
    return divida;
  } catch (error) {
    console.error('Erro ao buscar dívida:', error);
    throw error; // Throw error to be handled by controller
  }
}

async function updateDivida(dividaId, data) {
    try {
        const divida = await prisma.divida.update({
          where: {
            id: dividaId
          },
          data
        });
        return divida;
    } catch (error) {
        console.error('Erro ao atualizar dívida:', error);
        return res.status(500).json({ error: 'Erro ao atualizar dívida' });
    }
    
}

async function deleteDivida(dividaId) {
    try {
        const divida = await prisma.divida.delete({
          where: {
            id: dividaId
          }
        });
        return divida;
    } catch (error) {
        console.error('Erro ao deletar dívida:', error);
        return res.status(500).json({ error: 'Erro ao deletar dívida' });
    }
}

async function createDivida({ usuarioId, devedorId, valorInicial, taxaJuros, dataVencimento, observacoes }) {
    try {
        //const valorTotal = valorInicial * (1 + (taxaJuros / 100));
        const divida = await prisma.divida.create({
            data: {
                usuarioId,
                devedorId,
                valorInicial,
                taxaJuros,
                dataVencimento,
                observacoes,
            }
        });
        return divida;
    } catch (error) {
        console.error('Erro ao criar dívida:', error);
        return res.status(500).json({ error: 'Erro ao criar dívida' });
    }
}

export { getDividas, getDivida, updateDivida, deleteDivida, createDivida };