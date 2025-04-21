import express from 'express';
import cors from 'cors';
import authRoutas from './src/routes/authRoutas.js';
import devedorRoutas from './src/routes/devedorRoutas.js';
import dividaRoutas from './src/routes/dividaRoutas.js';
import pagamentoRoutas from './src/routes/pagamentoRoutas.js';
import dashboardRoutas from './src/routes/dashboardRoutas.js';
import { configurarTarefasAgendadas } from './src/services/notificacao.js';

const app = express();

app.use(cors({
    origin: '*', // Configuração do CORS para aceitar requisições de todos os lugares
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/auth', authRoutas);
app.use('/api/devedor', devedorRoutas);
app.use('/api/divida', dividaRoutas);
app.use('/api/pagamento', pagamentoRoutas);
app.use('/api/relatorios', dashboardRoutas);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    configurarTarefasAgendadas();
})
