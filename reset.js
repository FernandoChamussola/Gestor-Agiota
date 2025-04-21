import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

// Create interactive command line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for confirmation
function confirmar(mensagem) {
  return new Promise((resolve) => {
    rl.question(`${mensagem} (digite "CONFIRMAR" para prosseguir): `, (resposta) => {
      resolve(resposta === 'CONFIRMAR');
    });
  });
}

// Main function to run the reset process
async function resetarBancoDeDados() {
  console.log('\n🔧 UTILITÁRIO DE RESET DO BANCO DE DADOS 🔧');
  console.log('⚠️  ATENÇÃO: ESTA OPERAÇÃO IRÁ APAGAR TODOS OS DADOS ⚠️\n');
  
  try {
    // Confirm the dangerous operation
    const confirmado = await confirmar('⚠️ PERIGO: Você está prestes a APAGAR TODOS OS DADOS do banco de dados. Esta ação é IRREVERSÍVEL!');
    
    if (!confirmado) {
      console.log('❌ Operação cancelada pelo usuário.');
      return;
    }
    
    console.log('\n🔄 Iniciando processo de limpeza do banco de dados...');
    
    // Delete in order to respect relationships
    console.log('🔄 Removendo pagamentos...');
    const pagamentosRemovidos = await prisma.pagamento.deleteMany({});
    console.log(`✅ ${pagamentosRemovidos.count} pagamentos removidos.`);
    
    console.log('🔄 Removendo dívidas...');
    const dividasRemovidas = await prisma.divida.deleteMany({});
    console.log(`✅ ${dividasRemovidas.count} dívidas removidas.`);
    
    console.log('🔄 Removendo devedores...');
    const devedoresRemovidos = await prisma.devedor.deleteMany({});
    console.log(`✅ ${devedoresRemovidos.count} devedores removidos.`);
    
    console.log('🔄 Removendo usuários...');
    const usuariosRemovidos = await prisma.usuario.deleteMany({});
    console.log(`✅ ${usuariosRemovidos.count} usuários removidos.`);
    
    console.log('\n✅ BANCO DE DADOS RESETADO COM SUCESSO!');
    
  } catch (erro) {
    console.error('\n❌ ERRO AO RESETAR O BANCO DE DADOS:', erro);
  } finally {
    // Clean up
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script immediately
resetarBancoDeDados();