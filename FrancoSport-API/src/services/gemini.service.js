import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
    });
    
    this.systemInstruction = `
        Eres el asistente virtual experto de "Franco Sport", una tienda líder en ropa y equipamiento deportivo.
        
        TU OBJETIVO:
        Ayudar a CUALQUIER persona (desde atletas profesionales hasta personas que solo buscan comodidad diaria) a encontrar el producto ideal.
        
        TU ESTRATEGIA DE VENTA (EL MÉTODO DE LAS 5 PREGUNTAS):
        Antes de recomendar NADA, debes entender profundamente al usuario. NO asumas nada. Realiza una entrevista amigable pero estructurada.
        
        DEBES OBTENER RESPUESTA A ESTOS 5 PUNTOS CLAVE (Puedes preguntar uno por uno o agruparlos, pero sé conversacional):
        
        1.  **USO PRINCIPAL**: ¿Es para practicar un deporte específico (cuál), para ir al gimnasio, o para uso casual/diario (moda/comodidad)? (CRUCIAL: Muchos usuarios NO hacen deporte, solo quieren verse bien o estar cómodos).
        2.  **TIPO DE PRODUCTO**: ¿Buscas calzado, ropa, accesorios o equipamiento?
        3.  **ESTILO Y PREFERENCIAS**: ¿Prefieres diseños modernos y llamativos o algo más clásico y discreto? ¿Algún color favorito?
        4.  **PRIORIDAD**: ¿Qué es lo más importante para ti? ¿Máxima comodidad, durabilidad, rendimiento técnico o precio?
        5.  **PRESUPUESTO**: ¿Tienes un rango de precio aproximado en mente?

        TU COMPORTAMIENTO:
        - **NO RECOMIENDES INMEDIATAMENTE**: Si el usuario dice "quiero zapatillas", TU RESPUESTA DEBE SER PREGUNTAR.
        - **ADAPTABILIDAD**:
            - Si es un ATLETA: Habla de tecnología, rendimiento, amortiguación, agarre.
            - Si es CASUAL: Habla de comodidad, estilo, tendencias, combinabilidad.
        - **TONO**: Amable, paciente y experto. Usa emojis para dar vida a la conversación 👟👕🎒.

        EJEMPLO DE INICIO:
        Usuario: "Hola, busco algo para mis pies"
        Tú: "¡Hola! Con gusto te ayudo a encontrar el par perfecto. Para darte la mejor opción, necesito saber un poco más:
        1. ¿Las usarás para algún deporte en especial o son para el día a día?
        2. ¿Buscas algo con un estilo específico o color en mente?
        3. ¿Qué valoras más: la comodidad extrema o el diseño?
        4. ¿Tienes algún presupuesto pensado?"
    `;
  }

  async generateResponse(message, history = []) {
    try {
      // Convert history to Gemini format
      const chatHistory = history.map(msg => ({
        role: msg.is_from_user ? "user" : "model",
        parts: [{ text: msg.message }]
      }));

      // Prepend system instruction as the first message from "user" (or just part of the context)
      // For gemini-pro, we can simulate system instruction by adding it to the start of the chat
      // or initializing the chat with it.
      // A common pattern is to have the first turn be the system instruction.
      
      let finalHistory = chatHistory;
      
      if (finalHistory.length === 0) {
        // If no history, we can't easily inject system instruction as "history" without a user turn.
        // But startChat takes history.
        // We can just prepend the system instruction to the current message if history is empty?
        // Or better, we start the chat with a "priming" exchange if possible, but that's complex.
        // Simplest way: Prepend system instruction to the *current* message if it's the start,
        // or rely on the model to pick it up if we put it in the first history slot?
        // Actually, let's just prepend it to the message text for this turn if history is empty.
        // But if history exists, we assume the context is already set? No, the model is stateless between requests unless we send history.
        // So we need to make sure the system instruction is always part of the context.
        
        // Strategy: Add a fake user message with the system instruction and a fake model acknowledgement at the start of history.
        finalHistory = [
          {
            role: "user",
            parts: [{ text: this.systemInstruction }]
          },
          {
            role: "model",
            parts: [{ text: "Entendido. Soy el asistente experto de Franco Sport. Estoy listo para ayudar a los clientes con el método de las 5 preguntas." }]
          },
          ...chatHistory
        ];
      } else {
        // If history exists, we still want the system instruction to be the "root" of the conversation.
        // So we prepend it to the existing history.
        finalHistory = [
          {
            role: "user",
            parts: [{ text: this.systemInstruction }]
          },
          {
            role: "model",
            parts: [{ text: "Entendido. Soy el asistente experto de Franco Sport. Estoy listo para ayudar a los clientes con el método de las 5 preguntas." }]
          },
          ...chatHistory
        ];
      }

      const chat = this.model.startChat({
        history: finalHistory,
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating Gemini response:", error);
      throw new Error("Failed to generate AI response");
    }
  }
}

export const geminiService = new GeminiService();
