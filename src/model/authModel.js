import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function login(email, senha) {
    const usuario = await prisma.usuario.findFirst({
        where: {
            email,
            senha
        }
    });
    return usuario;
}

async function register(nome, email, senha , capitalTotal) {
    const usuario = await prisma.usuario.create({
        data: {
            nome,
            email,
            senha,
            capitalTotal
        }
    });
    return usuario;
}

export{
    login, register
}
