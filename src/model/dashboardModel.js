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

    // Data atual para comparações
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera horas para comparação por dia

    // Data do fim da semana atual (próximos 7 dias)
    const fimDaSemana = new Date(hoje);
    fimDaSemana.setDate(fimDaSemana.getDate() + 7);
    
    // Data para dívidas próximas do vencimento (3 dias no futuro)
    const tresDiasAdiante = new Date(hoje);
    tresDiasAdiante.setDate(tresDiasAdiante.getDate() + 3);

    // Calcula o total de todas as dívidas
    const totalValorDividas = dividas.reduce((total, divida) => total + divida.valorInicial, 0);
    
    // Calcula o total já pago
    const totalPagamentos = dividas.reduce((total, divida) => {
        const pagos = divida.pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);
        return total + pagos;
    }, 0);
    
    // Filtra dívidas por status
    const dividasAtivas = dividas.filter(divida => divida.status === 'ATIVA');
    const dividasAtrasadas = dividas.filter(divida => divida.status === 'ATRASADA');
    
    // Dívidas que vencem hoje
    const dividasVencemHoje = dividas.filter(divida => {
        const dataVencimento = new Date(divida.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento.getTime() === hoje.getTime() && 
               (divida.status === 'ATIVA' || divida.status === 'ATRASADA');
    });
    
    // Dívidas que vencem na semana
    const dividasVencemNaSemana = dividas.filter(divida => {
        const dataVencimento = new Date(divida.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento >= hoje && dataVencimento <= fimDaSemana && 
               (divida.status === 'ATIVA' || divida.status === 'ATRASADA');
    });
    
    // Dívidas próximas do vencimento (3 dias antes)
    const dividasProximasVencimento = dividas.filter(divida => {
        const dataVencimento = new Date(divida.dataVencimento);
        dataVencimento.setHours(0, 0, 0, 0);
        return dataVencimento > hoje && dataVencimento <= tresDiasAdiante && 
               divida.status === 'ATIVA';
    });
    
    // Calcula o valor esperado de retorno (principal + juros) das dívidas ativas e atrasadas
    const valorEsperadoRetorno = [...dividasAtivas, ...dividasAtrasadas].reduce((total, divida) => {
        // Calcula quanto já foi pago nesta dívida
        const pagamentosDaDivida = divida.pagamentos.reduce((sum, pagamento) => sum + pagamento.valor, 0);
        
        // Calcula o valor em aberto (principal)
        const valorEmAberto = divida.valorInicial - pagamentosDaDivida;
        
        // Calcula quanto tempo se passou desde o empréstimo até o vencimento (em meses)
        const dataEmprestimo = new Date(divida.dataEmprestimo);
        const dataVencimento = new Date(divida.dataVencimento);
        const mesesDeDuracao = (dataVencimento.getFullYear() - dataEmprestimo.getFullYear()) * 12 + 
                               dataVencimento.getMonth() - dataEmprestimo.getMonth();
        
        // Calcula o juro total baseado na taxa de juros mensal e o período
        const juroTotal = valorEmAberto * (divida.taxaJuros / 100) * mesesDeDuracao;
        
        // Retorna o valor principal em aberto + juros
        return total + valorEmAberto + juroTotal;
    }, 0);

    const dashboard = {
        nome: usuario.nome,
        dividasAtivas: dividasAtivas.length,
        dividasAtrasadas: dividasAtrasadas.length,
        totalValorDividas,
        totalPagamentos,
        valorRestante: totalValorDividas - totalPagamentos,
        dividasVencemHoje: dividasVencemHoje,
        dividasVencemNaSemana: dividasVencemNaSemana,
        dividasProximasVencimento: dividasProximasVencimento,
        valorEsperadoRetorno: valorEsperadoRetorno
    };


    return dashboard;
}

export { getDashboard };