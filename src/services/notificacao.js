import { PrismaClient } from '@prisma/client';
import { enviarMensagem } from './botSap.js';
import cron from 'node-cron';
import { format, addDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

// Função para enviar lembretes de dívidas próximas do vencimento (2 dias antes)
async function enviarLembretesVencimento() {
  try {
    console.log('📅 Verificando dívidas que vencem em 2 dias...');
    
    const dataVencimento = addDays(new Date(), 2);
    const dataFormatada = format(dataVencimento, 'yyyy-MM-dd');
    
    // Encontrar dívidas que vencem em 2 dias e que estejam ativas
    const dividas = await prisma.divida.findMany({
      where: {
        dataVencimento: {
          gte: new Date(`${dataFormatada}T00:00:00`),
          lt: new Date(`${dataFormatada}T23:59:59`),
        },
        status: 'ATIVA',
      },
      include: {
        devedor: true,
      },
    });
    
    console.log(`🔍 Encontradas ${dividas.length} dívidas para notificar`);
    
    // Para cada dívida, enviar mensagem para o devedor
    for (const divida of dividas) {
      // Calcular o valor atual com juros
      const { valorInicial, taxaJuros, dataEmprestimo } = divida;
      const diffEmDias = Math.floor((dataVencimento - new Date(dataEmprestimo)) / (1000 * 60 * 60 * 24));
      const jurosAplicado = valorInicial * (taxaJuros / 100) * (diffEmDias / 30);
      const valorTotal = valorInicial + jurosAplicado;
      
      const mensagem = `Bom dia ${divida.devedor.nome}, sua dívida de ${valorInicial.toFixed(2)}MT com juros de ${jurosAplicado.toFixed(2)} (total: R$ ${valorTotal.toFixed(2)}) tem como último dia de pagamento daqui a dois dias. #SystemACFF`;
      
      await enviarMensagem({
        numero: divida.devedor.telefone,
        mensagem,
      });
      
      console.log(`✉️ Lembrete enviado para ${divida.devedor.nome}`);
    }
    
    console.log('✅ Processo de lembretes concluído');
  } catch (error) {
    console.error('❌ Erro ao enviar lembretes de vencimento:', error);
  }
}

// Função para notificar sobre dívidas atrasadas com mensagem forte
async function notificarDividasAtrasadas() {
  try {
    console.log('🚨 Verificando dívidas atrasadas...');
    
    const hoje = new Date();
    
    // Encontrar dívidas vencidas que ainda estão marcadas como ativas
    const dividasAtrasadas = await prisma.divida.findMany({
      where: {
        dataVencimento: {
          lt: hoje,
        },
        status: {
          in: ['ATIVA', 'ATRASADA'],
        },
      },
      include: {
        devedor: true,
      },
    });
    
    console.log(`🔍 Encontradas ${dividasAtrasadas.length} dívidas atrasadas`);
    
    // Atualizar status das dívidas para ATRASADA
    for (const divida of dividasAtrasadas) {
      if (divida.status === 'ATIVA') {
        await prisma.divida.update({
          where: { id: divida.id },
          data: { status: 'ATRASADA' },
        });
      }
      
      // Calcular dias de atraso
      const diasAtraso = Math.floor((hoje - new Date(divida.dataVencimento)) / (1000 * 60 * 60 * 24));
      
      // Calcular juros de mora (adicional de 1% ao dia de atraso)
      const { valorInicial, taxaJuros, dataEmprestimo } = divida;
      const diffEmDias = Math.floor((hoje - new Date(dataEmprestimo)) / (1000 * 60 * 60 * 24));
      const jurosNormal = valorInicial * (taxaJuros / 100) * (diffEmDias / 30);
      const valorTotal = valorInicial + jurosNormal;
      
      // Mensagem forte para devedores atrasados
      const mensagem = `⚠️ URGENTE ${divida.devedor.nome}! Sua dívida de ${valorInicial.toFixed(2)} ESTÁ ATRASADA HÁ ${diasAtraso} DIAS! O valor atual com juros é de R$ ${valorTotal.toFixed(2)} e AUMENTA A CADA DIA! Entre em contato IMEDIATAMENTE para evitar CONSEQUÊNCIAS GRAVES! #SystemACFF`;
      
      await enviarMensagem({
        numero: divida.devedor.telefone,
        mensagem,
      });
      
      console.log(`📱 Notificação de atraso enviada para ${divida.devedor.nome}`);
    }
    
    console.log('✅ Processo de notificação de dívidas atrasadas concluído');
  } catch (error) {
    console.error('❌ Erro ao notificar dívidas atrasadas:', error);
  }
}

// Configurar tarefas agendadas
function configurarTarefasAgendadas() {
  // Executar todos os dias às 7h para lembretes de vencimento em 2 dias
  cron.schedule('0 7 * * *', async () => {
    console.log('🕖 Executando tarefa agendada de lembretes de vencimento');
    await enviarLembretesVencimento();
  });
  
  // Executar todos os dias às 10h para notificações de dívidas atrasadas
  cron.schedule('0 10 * * *', async () => {
    console.log('🕙 Executando tarefa agendada de notificação de dívidas atrasadas');
    await notificarDividasAtrasadas();
  });
  
  console.log('⏰ Tarefas agendadas configuradas com sucesso!');
}

export { configurarTarefasAgendadas };