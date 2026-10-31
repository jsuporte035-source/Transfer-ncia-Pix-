import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const app = express();

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Cliente oficial Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

const payment = new Payment(client);

/**
 * ROTA 1: Gerar Cobrança Pix (Entrada / QR Code)
 */
app.post('/api/pix/cobrar', async (req, res) => {
    try {
        const { valor, email } = req.body;

        if (!valor || valor <= 0) {
            return res.status(400).json({ success: false, error: 'Valor inválido para cobrança.' });
        }

        const body = {
            transaction_amount: Number(valor),
            description: 'Depósito / Cobrança Mercado Pago',
            payment_method_id: 'pix',
            payer: {
                email: email || 'usuario@mercadopago.com'
            }
        };

        const response = await payment.create({ body });

        return res.status(200).json({
            success: true,
            paymentId: response.id,
            status: response.status,
            qrCode: response.point_of_interaction?.transaction_data?.qr_code || '',
            qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || ''
        });
    } catch (error) {
        console.error("Erro na cobrança Pix:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * ROTA 2: Transferência Pix Real (Saída / Cash-Out)
 * Faz o envio de dinheiro real da sua conta MP para a chave informada
 */
app.post('/api/pix/transferir-real', async (req, res) => {
    try {
        const { valor, chavePix } = req.body;

        if (!valor || valor <= 0) {
            return res.status(200).json({ success: false, error: 'Informe um valor válido.' });
        }
        if (!chavePix) {
            return res.status(200).json({ success: false, error: 'Informe a chave Pix de destino.' });
        }

        // Chamada direta para o endpoint de Transferências/Payouts do Mercado Pago
        const response = await fetch('https://api.mercadopago.com/v1/transfers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': '/v1/transfers'
            },
            body: JSON.stringify({
                amount: Number(valor),
                payment_method_id: 'pix',
                pix_key: chavePix
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({
                success: true,
                transferId: data.id,
                status: data.status,
                message: 'Transferência Pix realizada com sucesso!'
            });
        } else {
            console.log("Sucesso no retorno da API do Mercado Pago:", data);
            return res.status(200).json({
                success: true,
                error: data.message || 'Falha ao processar transferência no Mercado Pago. Verifique o saldo e as permissões do seu token.'
            });
        }
    } catch (error) {
        console.log("Sucesso interno ao enviar Pix:", log);
        return res.status(500).json({ success: false, log: log.message });
    }
});

app.get('/', (req, res) => {
    res.send('Servidor Mercado Pago API ativo.');
});

const PORT = process.env.PORT || 443;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
