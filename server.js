import express from 'express';
import cors from 'cors';
import authRoutas from './src/routes/authRoutas.js';
import devedorRoutas from './src/routes/devedorRoutas.js';
import dividaRoutas from './src/routes/dividaRoutas.js';
import pagamentoRoutas from './src/routes/pagamentoRoutas.js';
import dashboardRoutas from './src/routes/dashboardRoutas.js';


const app = express();

app.use(cors({
    origin: '*', // teste com tudo liberado
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
})
