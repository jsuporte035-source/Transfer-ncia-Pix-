import 'dotenv/config';import express from 'express';import cors from 'cors';import { MercadoPagoConfig, Payment } from 'mercadopago';
const app = express();app.use(express.json());app.use(cors()); // Permite que a página HTML se comunique com o servidor
// Inicializa o Mercado Pago usando a variável de ambiente seguraconst client = new MercadoPagoConfig({   accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });const payment = new Payment(client);
app.post('/api/pix/gerar', async (req, res) => {  try {    const { valor, email, chavePix } = req.body;
    const body = {      transaction_amount: Number(valor),      description: `Saque Instantâneo - Chave: ${chavePix}`,      payment_method_id: 'pix',      payer: {        email: email || 'cliente@banco-next.com'      }    };
    const response = await payment.create({ body });
    return res.status(200).json({      success: true,      paymentId: response.id,      qrCode: response.point_of_interaction.transaction_data.qr_code,      qrCodeBase64: response.point_of_interaction.transaction_data.qr_code_base64    });  } catch (error) {    console.error("Erro ao gerar Pix no Mercado Pago:", error);    return res.status(500).json({ success: false, error: error.message });  }});
const PORT = process.env.PORT || 3000;app.listen(PORT, () => {  console.log(`Servidor rodando na porta ${PORT}`);});
