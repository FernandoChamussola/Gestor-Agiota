import {  login, register } from "../model/authModel.js";

async function loginController(req, res) {
    const { email, senha } = req.body;
    try {
        const usuario = await login(email, senha);
        if (usuario) {
            res.json({ id: usuario.id });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
}
async function registerController(req, res) {
    const { nome, email, senha, capitalTotal } = req.body;
    try {
        const usuario = await register(nome, email, senha, parseFloat(capitalTotal));
        res.json({ id: usuario.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
}

export {
    loginController,
    registerController
}