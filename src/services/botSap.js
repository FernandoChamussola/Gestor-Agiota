import axios from 'axios';

async function enviarMensagem({ numero, mensagem }) {
  try {
    const { data } = await axios.post('https://mywhatssapapi.onrender.com/enviar', {
      numero,
      mensagem,
    });
    console.log('✅ Mensagem enviada:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar:', error.response?.data || error.message);
    return false;
  }
}

export {
  enviarMensagem
};
