import { PrismaClient } from '@prisma/client';
import { getCapital, totalInvestido, valorPendente, capitalDisponivel, lucroTotal } from './usuarioModel.js';
const prisma = new PrismaClient();


 const getUsuario = async (id) => {
     const usuario = await prisma.usuario.findUnique({ where: { id } });
     return usuario;
 }

async function getDashboard(usuarioId) {
    const usuario = await getUsuario(usuarioId);
    const dividas = await prisma.divida.findMany({
        where: { usuarioId: usuarioId },
        include: { pagamentos: true }
    });

    const totalValorDividas = dividas.reduce((total, divida) => total + divida.valorInicial, 0);
    const totalPagamentos = dividas.reduce((total, divida) => {
        const pagos = divida.pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);
        return total + pagos;
    }, 0);

    const dashboard = {
        nome: usuario.nome,
        dividasAtivas: dividas.filter(divida => divida.status === 'ATIVA').length,
        dividasAtrasadas: dividas.filter(divida => divida.status === 'ATRASADA').length,
        totalValorDividas,
        totalPagamentos,
        valorRestante: totalValorDividas - totalPagamentos
    };

    return dashboard;
}

export{
    getDashboard 
}