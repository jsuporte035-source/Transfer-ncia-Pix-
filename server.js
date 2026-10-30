import 'dotenv/config';import express from 'express';import cors from 'cors';import { MercadoPagoConfig, Payment } from 'mercadopago';
const app = express();
app.use(express.json());app.use(cors({    origin: '*',    methods: ['GET', 'POST'],    allowedHeaders: ['Content-Type']}));
// Configuração do SDK com o Access Token seguro do .envconst client = new MercadoPagoConfig({   accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
const payment = new Payment(client);
// Rota para processar a cobrança/saque Pixapp.post('/api/pix/gerar', async (req, res) => {  try {    const { valor, email, chavePix } = req.body;
    if (!valor || valor <= 0) {      return res.status(400).json({ success: false, error: 'Valor inválido para a transação.' });    }
    if (!chavePix) {      return res.status(400).json({ success: false, error: 'Chave Pix de destino não informada.' });    }
    const body = {      transaction_amount: Number(valor),      description: `Operação Pix Mercado Pago - Destino: ${chavePix}`,      payment_method_id: 'pix',      payer: {        email: email || 'cliente@mercadopago.com'      }    };
    const response = await payment.create({ body });
    return res.status(200).json({      success: true,      paymentId: response.id,      status: response.status,      qrCode: response.point_of_interaction?.transaction_data?.qr_code || '',      qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64 || ''    });
  } catch (error) {    console.error("Erro no processamento do Mercado Pago:", error);    return res.status(500).json({       success: false,       error: error.message || 'Erro interno de comunicação com o Mercado Pago.'     });  }});
app.get('/', (req, res) => {  res.send('Servidor Node.js Mercado Pago rodando com sucesso!');});
const PORT = process.env.PORT || 3000;app.listen(PORT, () => {  console.log(`Servidor ativado na porta ${PORT}`);});
