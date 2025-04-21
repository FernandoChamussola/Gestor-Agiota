import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function register({nome , telefone , endereco}){
    const devedor = await prisma.devedor.create({
        data: {
        nome,
        telefone,
        endereco
        }
    });
    return devedor;
}

async function getDevedor(telefone){
    const devedor = await prisma.devedor.findFirst({
        where: {
            telefone
        }
    });
    return devedor;
}

async function getDevedoresByUsuario(usuarioId) {
    // Verificar se existem dívidas para este usuário
    const dividas = await prisma.divida.findMany({
      where: { usuarioId: usuarioId }
    });
    
    // Se não existem dívidas, retornar todos os devedores
    
      return await prisma.devedor.findMany();
    
    
    // // Se existem dívidas, buscar apenas os devedores relacionados
    // const devedorIds = dividas.map(divida => divida.devedorId);
    
    // const devedores = await prisma.devedor.findMany({
    //   where: {
    //     id: {
    //       in: devedorIds
    //     }
    //   }
    // });
    

  }

async function updateDevedor(id, {nome , telefone , endereco}){
    const devedor = await prisma.devedor.update({
        where: {
            id
        },
        data: {
            nome,
            telefone,
            endereco
        }
    });
    return devedor;
}

async function deleteDevedor(id){
    const devedor = await prisma.devedor.delete({
        where: {
            id
        }
    });
    return devedor;
}

async function getDividasByDevedor(devedorId){
    const dividas = await prisma.divida.findMany({
        where: {
            devedorId
        }
    });
    return dividas;
}


export {register, getDevedor, getDevedoresByUsuario, updateDevedor ,deleteDevedor , getDividasByDevedor};