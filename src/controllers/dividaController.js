import { getDividas, getDivida, updateDivida, deleteDivida, createDivida } from '../model/dividaModel.js'

async function getDividasController(req, res) {
  const { usuarioId } = req.params;  // Extrair o usuarioId do objeto params
  try {
    const dividas = await getDividas(usuarioId);
    res.json(dividas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dívidas' });
  }
}

async function getDividaController(req, res) {
  const { id } = req.params;
  try {
    const divida = await getDivida(id);
    const valorTotal = divida.valorInicial * (1 + (divida.taxaJuros / 100));
    res.json({...divida, valorTotal});
  } catch (error) {
    console.error('Erro no controller:', error.message);
    if (error.message === 'Dívida não encontrada') {
      res.status(404).json({ error: 'Dívida não encontrada' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar dívida' });
    }
  }
}


async function updateDividaController(req, res) {
  const { id } = req.params;
  const data = req.body;
  try {
    const divida = await updateDivida(id, data);
    res.json(divida);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
}

async function deleteDividaController(req, res) {
  const { id } = req.params;
  try {
    const divida = await deleteDivida(id);
    res.json(divida);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar dívida' });
  }
}

async function createDividaController(req, res) {
  const {usuarioId, devedorId, valorInicial, taxaJuros, dataVencimento, observacoes} = req.body;
  try {
    const valorInicialFloat = parseFloat(valorInicial);
    const taxaJurosFloat = parseFloat(taxaJuros);
    const dataVencimentoDate = new Date(dataVencimento);
    const divida = await createDivida({
      usuarioId,
      devedorId,
      valorInicial: valorInicialFloat,
      taxaJuros: taxaJurosFloat,
      dataVencimento: dataVencimentoDate.toISOString(),
      observacoes
    });
    res.status(201).json(divida);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
}

export { getDividasController, getDividaController, updateDividaController, deleteDividaController, createDividaController };
