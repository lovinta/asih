// TODO: all Spanish strings below need check by a fluent speaker.
// Keys must stay identical to src/i18n/en.ts (checked by parity test).
import type { en } from "./en";

type Strings = typeof en;

export const es: Strings = {
  appTitle: "Ayuda Comunitaria",
  offlineBanner: "Modo de demostración sin conexión: datos de ejemplo, sin llamadas de IA.",
  exampleLabel: "EJEMPLO (datos sintéticos)",
  languageToggle: "EN | ES",
  readAloud: "Leer en voz alta",
  repeat: "Repetir",
  pause: "Pausa",
  speechRate: "Velocidad de voz",
  back: "Atrás",
  loading: "Estamos trabajando.",
  getHelpButton: "Obtener ayuda — no es consejo médico",
  deleteEverything: "Borrar todo",
  dataNotice: {
    title: "Antes de compartir",
    body: "Sus elementos guardados permanecen en este teléfono. Para leer una foto o nota de voz, se envía al servicio de IA de Meta. Meta dice que no lo usa para entrenar su IA. Esta aplicación le dice a Meta que no guarde sus respuestas. Meta aún puede conservar lo enviado según sea necesario para prestar el servicio, cumplir la ley y controlar el uso indebido y la seguridad; no dice por cuántos días. Borrar todo elimina lo guardado en este teléfono. No puede eliminar lo que Meta haya conservado.",
    acknowledge: "Entiendo",
  },
  getHelp: {
    title: "Obtener ayuda — no es consejo médico",
    subtitle: "Esta aplicación nunca llama a nadie por sí sola. Toque un número para llamar.",
    call911: "Llamar al 911 (emergencia en EE. UU.)",
    indonesia112: "Llamar al 112 (Indonesia, la cobertura varía según la ciudad)",
    indonesia119: "Llamar al 119 (Indonesia, emergencias médicas)",
    neverCalls: "La aplicación nunca llama por sí sola.",
  },
  confirm: {
    title: "Por favor confirme, uno a la vez",
    confirmButton: "Confirmar",
    changeButton: "Cambiar",
    editLabel: "Valor correcto",
    confirmed: "Confirmado",
    waiting: "Esperando su confirmación",
    allDone: "Todos los elementos están confirmados.",
  },
  flowA: {
    title: "Ayuda con citas",
    uploadPhoto: "Tome una foto de su carta",
    useExample: "Usar carta de ejemplo",
    unreadableNote: "No puedo leer esta parte",
    questionsTitle: "Sus preguntas para la visita",
    questionsHint:
      "Escriba sus propias preguntas. Se guardan exactamente como las escribe.",
    addQuestion: "Agregar pregunta",
    downloadIcs: "Descargar archivo de calendario (.ics)",
    saveVisit: "Guardar visita",
    transportTitle: "Cómo llegar",
  },
  flowB: {
    title: "Encontrar un grupo y asistir",
    interestLabel: "¿Qué le gusta hacer?",
    interestHint:
      "Por ejemplo: caminar, jardinería. También puede pegar el texto de un anuncio.",
    placeLabel: "Código postal o ciudad (opcional)",
    placeHint: "Nunca escriba la dirección de su casa.",
    findButton: "Buscar actividades",
    planTitle: "Plan para asistir",
    checklistTitle: "Lista de preparación",
    inviteTitle: "Invitar a un grupo pequeño",
    inviteHint:
      "Usted elige a quién invitar. La aplicación nunca envía mensajes por sí sola.",
    namesLabel: "Nombres (escritos por usted)",
    openWhatsapp: "Abrir en WhatsApp",
    shareButton: "Compartir",
    rideNote: "Usted organiza el transporte. Esta aplicación nunca reserva viajes.",
    sharedSource: "Anuncio compartido por la persona",
    calendarTypes: ["Biblioteca pública", "Centro de personas mayores", "Departamento de parques"],
    inviteTemplate:
      "¡Hola{names}! ¿Le gustaría acompañarme a {event} el {date} a las {time}? Nos reunimos en {place}. ¡Avíseme!",
    meetTipsTitle: "Conocer gente nueva",
    meetTips: "Reúnase en un lugar público. Avise a una persona de confianza. Puede irse en cualquier momento.",
    whatsappGroupNote:
      "Para crear un grupo de WhatsApp: abra WhatsApp, toque Nuevo grupo, agregue a las personas que elija y envíe su invitación.",
  },
  flowC: {
    title: "Revisión de anuncios y estafas de salud",
    shareAdHint: "Comparta una captura del anuncio o pegue el texto del anuncio.",
    useExampleAd: "Usar anuncio de ejemplo",
    cuesTitle: "Señales de advertencia que puedo ver",
    whyAdTitle: "¿Por qué veo este anuncio?",
    draftTitle: "Pregunte a alguien de confianza",
    draftDefault: "¿Puedes mirar este anuncio conmigo?",
    unknownAdvertiser: "este anunciante",
    draftTemplate:
      "¿Puede mirar este anuncio conmigo? Es de {advertiser}. Quiero una segunda opinión antes de pagar o compartir datos.",
    whyStep1:
      "Toque los tres puntos del anuncio y luego toque «Por qué veo este anuncio» para ver lo que el anunciante eligió.",
    whyStep2: "Revise sus preferencias de anuncios en el Centro de cuentas: {url}",
    whyStep4: "Busque al anunciante en la Biblioteca de anuncios de Meta: {url}",
    regionalNote: "Las opciones de anuncios regionales varían.",
    openWhatsapp: "Abrir en WhatsApp",
    shareButton: "Compartir",
    reportHint:
      "Para denunciar un anuncio: toque los tres puntos del anuncio y luego toque Denunciar anuncio.",
  },
  safety: {
    scamWithCues:
      "Puedo ver estas señales de advertencia. No puedo decir si esto es real o si el producto funciona. Consulte con alguien de su confianza antes de pagar o compartir datos.",
    noCuesSuffix: "Eso no significa que sea seguro.",
    fixedSafeReply:
      "No puedo ayudar con eso. Si necesita ayuda ahora, use el botón Obtener ayuda. También puede hablar con alguien de su confianza.",
    whatsappCue:
      "Pasar a WhatsApp cuenta como señal de advertencia cuando se pide antes de que pueda comprobar quiénes son.",
  },
  voice: {
    title: "Nota de voz",
    uploadVoice: "Subir una nota de voz (WAV)",
    transcriptTitle: "Lo que usted dijo",
    replyDraftTitle: "Su borrador de respuesta",
    openWhatsapp: "Abrir en WhatsApp",
    shareButton: "Compartir",
  },
};
