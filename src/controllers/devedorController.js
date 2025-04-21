import {register, getDevedor, getDevedoresByUsuario, updateDevedor , deleteDevedor ,getDividasByDevedor} from "../model/devedorModel.js";

async function registerController(req, res) {
    const { nome, telefone, endereco } = req.body;
    try {
        const devedor = await register({nome, telefone, endereco})
        res.json({ id: devedor.id });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar devedor' });
    }
}

async function getDevedorController(req, res) {
    const { telefone } = req.params;
    try {
        const devedor = await getDevedor(telefone);
        res.json(devedor);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar devedor' });
    }
}

async function getDevedoresByUsuarioController(req, res) {
    const { usuarioId } = req.params;
    try {
        const devedores = await getDevedoresByUsuario(usuarioId);
        res.json(devedores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar devedores do usuario' });
    }
}

async function updateDevedorController(req, res) {
    const { id } = req.params;
    const { nome, telefone, endereco } = req.body;
    try {
        const devedor = await updateDevedor(id,{ nome, telefone, endereco})
        res.json({ id: devedor.id });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar devedor' });
    }
}

async function deleteDevedorController(req , res) {
    const {id} = req.params;

    try {
        const devedor = await deleteDevedor(id);
        res.json(devedor);
    } catch (error) {
        res.status(500).json({error : 'Erro ao deletar o devedor'})
    }
}

async function getDividasByDevedorController(req,res) {
    const { id } = req.params;
    try {
        const dividas = await getDividasByDevedor(id);
        res.json(dividas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dividas do devedor' });
    }
}

export {registerController, getDevedorController, getDevedoresByUsuarioController, updateDevedorController ,deleteDevedorController, getDividasByDevedorController}

