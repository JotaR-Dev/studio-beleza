import axios from 'axios';

type WhatsAppTemplateParameter = {
  type: 'text';
  text: string;
};

export class WhatsAppService {
  static async sendTemplate(to: string, templateName: string, parameters: string[]) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new Error('META_ACCESS_TOKEN e PHONE_NUMBER_ID são obrigatórios para enviar WhatsApp.');
    }

    const digits = to.replace(/\D/g, '');
    const recipient = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    if (recipient.length < 12 || recipient.length > 15) {
      throw new Error('O destinatário do WhatsApp não possui um número válido.');
    }

    const apiVersion = process.env.META_API_VERSION || 'v26.0';
    const languageCode = process.env.WHATSAPP_LANGUAGE_CODE || 'pt_BR';
    const bodyParameters: WhatsAppTemplateParameter[] = parameters.map((text) => ({
      type: 'text',
      text,
    }));

    try {
      await axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [{ type: 'body', parameters: bodyParameters }],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const details = error.response?.data ?? error.message;
        throw new Error(`Falha na WhatsApp Cloud API: ${JSON.stringify(details)}`, { cause: error });
      }

      throw error;
    }
  }
}
