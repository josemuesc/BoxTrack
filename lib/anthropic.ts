import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type MovimientoExtraido = {
  nombre: string;
  reps: string;
  peso_kg: number | null;
  porcentaje_rm: number | null;
};

export type WodExtraido = {
  nombre: string;
  formato: "for_time" | "amrap" | "emom" | "max_weight" | "otro";
  movimientos: MovimientoExtraido[];
};

const JERGA_CROSSFIT = `
Jerga y abreviaciones comunes en pizarras de CrossFit (pueden venir en
español o inglés, y a veces mal escritas a mano):
- Formatos: "For Time" / "RFT" (rounds for time), "AMRAP" (as many rounds/reps
  as possible), "EMOM" (every minute on the minute), "Max Weight" / "1RM",
  "Chipper", "Tabata".
- Esquemas de reps típicos: "21-15-9", "5-5-5-5-5", "3RM", "10-9-8-...-1".
- Movimientos y sus abreviaciones: T2B/TTB (toes to bar), C2B (chest to bar
  pull-up), HSPU (handstand push-up), DU (double unders), KBS (kettlebell
  swing), WB (wall ball), TB (thruster), OHS (overhead squat), FS (front
  squat), BS (back squat), DL (deadlift), SN (snatch), CJ (clean and jerk),
  PP (push press), PJ (push jerk), STOH (shoulder to overhead), GHD (GHD
  sit-up), MU (muscle-up), BMU (bar muscle-up), RMU (ring muscle-up), BJ (box
  jump), CTB, PU (pull-up), SU (sit-up), Row/Cal Row, Bike/Cal Bike, Run.
- Pesos: pueden venir en kg o lb, y a veces como porcentaje de un RM (ej.
  "5 Push Jerk @70%" significa 70% del RM del atleta en push jerk, no un peso
  absoluto).
- El buy-in/cash-out es parte del mismo WOD, no un movimiento aparte.
`.trim();

const TOOL_NAME = "registrar_wod";

export async function extraerWodDeImagen(params: {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<{ data: WodExtraido } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." };
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      system: `Eres un asistente que transcribe fotos de pizarras de WODs de CrossFit a un formato estructurado. ${JERGA_CROSSFIT}\n\nInterpreta la letra y las abreviaciones lo mejor posible. Si un dato no aparece en la foto (peso o porcentaje), usa null en vez de inventarlo. Usa el formato que más se ajuste al WOD: "for_time" (por tiempo/RFT), "amrap", "emom", "max_weight" (buscar máximo peso), u "otro" si no calza en los anteriores.`,
      tool_choice: { type: "tool", name: TOOL_NAME },
      tools: [
        {
          name: TOOL_NAME,
          description:
            "Registra el WOD estructurado extraído de la foto de la pizarra.",
          input_schema: {
            type: "object",
            properties: {
              nombre: {
                type: "string",
                description:
                  'Nombre del WOD si aparece (ej. "Fran"), o una descripción corta si no tiene nombre.',
              },
              formato: {
                type: "string",
                enum: ["for_time", "amrap", "emom", "max_weight", "otro"],
              },
              movimientos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nombre: { type: "string" },
                    reps: {
                      type: "string",
                      description:
                        'Reps o esquema tal como aparece, ej. "21-15-9", "10", "AMRAP 12 min".',
                    },
                    peso_kg: { type: ["number", "null"] },
                    porcentaje_rm: {
                      type: ["number", "null"],
                      description: "Porcentaje de RM si se menciona, ej. 70.",
                    },
                  },
                  required: ["nombre", "reps", "peso_kg", "porcentaje_rm"],
                },
              },
            },
            required: ["nombre", "formato", "movimientos"],
          },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: params.mediaType,
                data: params.base64,
              },
            },
            {
              type: "text",
              text: "Extrae el WOD de esta foto de pizarra.",
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === TOOL_NAME,
    );

    if (!toolUse || toolUse.type !== "tool_use") {
      return { error: "No se pudo interpretar la foto. Intenta de nuevo." };
    }

    return { data: toolUse.input as WodExtraido };
  } catch {
    return {
      error: "No se pudo procesar la foto con el servicio de IA.",
    };
  }
}
