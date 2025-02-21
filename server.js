import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import morgan from 'morgan';

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Funções Auxiliares
const calculaJurosSimples = (valorInicial, taxaJuros, dataInicial) => {
  const hoje = new Date();
  const mesesDecorridos = Math.floor(
    (hoje - new Date(dataInicial)) / (1000 * 60 * 60 * 24 * 30)
  );
  const juros = valorInicial * (taxaJuros / 100) * mesesDecorridos;
  return valorInicial + juros;
};

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Token erro' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token malformatado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = { id: decoded.id };
    return next();
  });
};

// Rotas de Autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha,capitalTotal } = req.body;
    const capitalTotalFloat = parseFloat(capitalTotal);
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExiste) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashSenha = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hashSenha,
        capitalTotal:capitalTotalFloat
      }
    });

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({ token });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ token });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Rotas de Dívidas
app.post('/api/dividas', authMiddleware, async (req, res) => {
    try {
      const { 
        nomeDevedor, 
        telefone, 
        endereco, 
        valorInicial, 
        taxaJuros, 
        dataVencimento, 
        observacoes 
      } = req.body;
  
      const usuarioId = req.user.id;
  
      // Buscar devedor
      let devedor = await prisma.devedor.findFirst({
        where: { telefone }
      });
  
      if (devedor) {
        // Se o devedor existir, atualize
        devedor = await prisma.devedor.update({
          where: {
            id: devedor.id
          },
          data: {
            nome: nomeDevedor,
            endereco: endereco
          }
        });
      } else {
        // Se o devedor não existir, crie
        devedor = await prisma.devedor.create({
          data: {
            nome: nomeDevedor,
            telefone: telefone,
            endereco: endereco
          }
        });
      }
  
      // Criar dívida
      const divida = await prisma.divida.create({
        data: {
          valorInicial,
          taxaJuros,
          dataVencimento: new Date(dataVencimento),
          observacoes,
          usuario: { connect: { id: usuarioId } },
          devedor: { connect: { id: devedor.id } } // Usando o id do devedor
        }
      });
  
      return res.status(201).json(divida);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Erro ao criar dívida' });
    }
  });

  
app.get('/api/dividas', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const dividas = await prisma.divida.findMany({
      where: {
        usuarioId
      },
      include: {
        devedor: true,
        pagamentos: true
      }
    });

    const dividasComValorAtual = dividas.map(divida => {
      const valorPago = divida.pagamentos.reduce((total, pag) => total + pag.valor, 0);
      const valorAtual = calculaJurosSimples(
        divida.valorInicial,
        divida.taxaJuros,
        divida.dataEmprestimo
      );

      return {
        ...divida,
        valorPago,
        valorAtual,
        valorRestante: valorAtual - valorPago
      };
    });

    return res.json(dividasComValorAtual);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar dívidas' });
  }
});

app.post('/api/dividas/:id/pagamento', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    const usuarioId = req.user.id;

    const divida = await prisma.divida.findFirst({
      where: {
        id,
        usuarioId
      },
      include: {
        pagamentos: true
      }
    });

    if (!divida) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        valor,
        divida: { connect: { id } }
      }
    });

    // Verificar se a dívida foi quitada
    const totalPago = divida.pagamentos.reduce((total, pag) => total + pag.valor, 0) + valor;
    const valorAtual = calculaJurosSimples(
      divida.valorInicial,
      divida.taxaJuros,
      divida.dataEmprestimo
    );

    if (totalPago >= valorAtual) {
      await prisma.divida.update({
        where: { id },
        data: { status: 'QUITADA' }
      });
    }

    return res.status(201).json(pagamento);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

// Rota de Capital/Movimentações
app.post('/api/movimentacoes', authMiddleware, async (req, res) => {
  try {
    const { tipo, valor, descricao } = req.body;
    const usuarioId = req.user.id;

    const movimentacao = await prisma.movimentacao.create({
      data: {
        tipo,
        valor,
        descricao,
        usuario: { connect: { id: usuarioId } }
      }
    });

    return res.status(201).json(movimentacao);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar movimentação' });
  }
});

// Rotas de Relatórios
app.get('/api/relatorios/dashboard', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const dividas = await prisma.divida.findMany({
      where: {
        usuarioId
      },
      include: {
        pagamentos: true
      }
    });

    const movimentacoes = await prisma.movimentacao.findMany({
      where: {
        usuarioId
      }
    });

    const { capitalTotal } = await prisma.usuario.findUnique({
      where: {
        id: usuarioId
      },
      select: {
        capitalTotal: true
      }
    });

    const capitalInvestido = dividas
      .filter(d => d.status !== 'QUITADA')
      .reduce((total, div) => total + div.valorInicial, 0);

    const totalRecebido = dividas.reduce((total, div) => {
      return total + div.pagamentos.reduce((t, p) => t + p.valor, 0);
    }, 0);

    const dividasQuitadas = dividas.filter(d => d.status === 'QUITADA');
    const lucroTotal = dividasQuitadas
      .reduce((total, div) => total + (div.valorInicial * (div.taxaJuros / 100)), 0);


    const totalPendente = dividas
      .filter(d => d.status !== 'QUITADA')
      .reduce((total, div) => {
        const valorAtual = calculaJurosSimples(
          div.valorInicial,
          div.taxaJuros,
          div.dataEmprestimo
        );
        const pago = div.pagamentos.reduce((t, p) => t + p.valor, 0);
        return total + (valorAtual - pago);
      }, 0);

    return res.json({
      capitalTotal,
      capitalInvestido,
      lucroTotal,
      totalPendente,
      capitalDisponivel: capitalTotal - capitalInvestido
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar dashboard' });
  }
});

app.get('/api/relatorios/devedores/pdf', authMiddleware, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const dividas = await prisma.divida.findMany({
      where: {
        usuarioId,
        status: {
          not: 'QUITADA'
        }
      },
      include: {
        devedor: true,
        pagamentos: true
      }
    });

    // Configurar resposta como PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=devedores.pdf');

    const doc = new PDFDocument();
    doc.pipe(res);

    // Configurar cabeçalho do PDF
    doc.fontSize(20).text('Relatório de Devedores', {
      align: 'center'
    });
    doc.moveDown();

    // Adicionar cada devedor
    dividas.forEach(divida => {
      doc.fontSize(14).text(`Devedor: ${divida.devedor.nome}`);
      doc.fontSize(12).text(`Telefone: ${divida.devedor.telefone}`);
      doc.fontSize(12).text(`Endereço: ${divida.devedor.endereco}`);
      doc.fontSize(12).text(`Valor inicial: R$ ${divida.valorInicial}`);
      doc.fontSize(12).text(`Taxa de juros: ${divida.taxaJuros}%`);
      doc.fontSize(12).text(`Data de vencimento: ${divida.dataVencimento}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});


// Rota para contar quantos usuários existem no sistema
app.get('/usuarios/count', async (req, res) => {
    try {
      const count = await prisma.usuario.count();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao contar usuários' });
    }
  });
  
  // Rota para ver quantas dívidas cada usuário tem cadastradas
  app.get('/usuarios/dividas', async (req, res) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        include: {
          dividas: true, // Inclui as dívidas de cada usuário
        },
      });
  
      const result = usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.nome,
        dividasCount: usuario.dividas.length,
      }));
  
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dívidas dos usuários' });
    }
  });
  
  // Rota para apagar todas as dívidas quitadas
  // Rota para apagar todas as dívidas quitadas
app.delete('/dividas/quitadas', async (req, res) => {
    try {
      // Primeiro, exclua os pagamentos associados às dívidas quitadas
      await prisma.pagamento.deleteMany({
        where: {
          divida: {
            status: 'QUITADA',
          },
        },
      });
  
      // Agora, exclua as dívidas quitadas
      const deletedDividas = await prisma.divida.deleteMany({
        where: {
          status: 'QUITADA',
        },
      });
  
      res.json({ message: 'Dívidas quitadas e seus pagamentos apagados com sucesso', deletedCount: deletedDividas.count });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao apagar dívidas quitadas' });
    }
  });
// Middleware de Erro Global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});