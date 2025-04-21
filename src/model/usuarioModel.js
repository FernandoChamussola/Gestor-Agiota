import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePassword(email, senha) {
    const usuario = await prisma.usuario.update({
        where: {
            email
        },
        data: {
            senha
        }
    });
    return usuario;
}

async function updateCapitalTotal(email, capitalTotal) {
    const usuario = await prisma.usuario.update({
        where: {
            email
        },
        data: {
            capitalTotal
        }
    });
    return usuario;
}

async function getCapital(email) {
    const usuario = await prisma.usuario.findUnique({
        where: {
            email
        },
        select: {
            capitalTotal: true
        }
    });
    return usuario;
}

async function totalInvestido(email) {
    const totalInvestido = await prisma.divida.aggregate({
        where: {
            usuario: {
                email
            },
            status: 'ATIVA'
        },
        _sum: {
            valorInicial: true
        }
    });
    return totalInvestido._sum.valorInicial || 0.00;
}
async function valorPendente(email) {
    const dividas = await prisma.divida.findMany({
        where: {
            usuario: {
                email
            },
            status: 'ATIVA'
        },
        select: {
            valorInicial: true,
            taxaJuros: true
        }
    });

    const totalJuros = dividas.reduce((total, divida) => {
        const juros = divida.valorInicial * divida.taxaJuros;
        return total + juros;
    }, 0);

    return totalJuros.toFixed(2);
}

async function capitalDisponivel(email) {
    const usuario = await getCapital(email);
    const investido = await totalInvestido(email); // nome diferente
    return usuario.capitalTotal - investido.toFixed(2);
}


async function lucroTotal(email) {
    const dividas = await prisma.divida.findMany({
        where: {
            usuario: {
                email
            },
            status: 'QUITADA'
        },
        select: {
            valorInicial: true,
            taxaJuros: true
        }
    });

    const totalLucro = dividas.reduce((total, divida) => {
        const lucro = divida.valorInicial * divida.taxaJuros;
        return total + lucro;
    }, 0);

    return totalLucro.toFixed(2);
}

export { updatePassword, updateCapitalTotal , getCapital, totalInvestido, valorPendente , capitalDisponivel, lucroTotal};