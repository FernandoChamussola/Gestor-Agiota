import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function registerPagamento({dividaId , valorPagamento}){
    const pagamento = await prisma.pagamento.create({
        data: {
        valor: valorPagamento,
        dividaId
        }
    });
    return pagamento;
}

async function getPagamentos(dividaId) {
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        dividaId
      }
    });
    return pagamentos;
}

async function deletePagamento(pagamentoId) {
    const pagamento = await prisma.pagamento.delete({
      where: {
        id: pagamentoId
      }
    });
    return pagamento;
 }



export {registerPagamento , getPagamentos, deletePagamento};
