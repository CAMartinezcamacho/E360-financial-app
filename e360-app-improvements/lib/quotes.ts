export const motivationalQuotes: string[] = [
  "El exito no es la clave de la felicidad. La felicidad es la clave del exito.",
  "Cada peso que ahorras hoy es una inversion en tu futuro.",
  "Los grandes logros comienzan con pequenos pasos diarios.",
  "Tu negocio crece cuando tu mentalidad crece primero.",
  "El mejor momento para empezar fue ayer. El segundo mejor momento es ahora.",
  "No cuentes los dias, haz que los dias cuenten.",
  "La disciplina financiera de hoy es la libertad de manana.",
  "Suena en grande, empieza pequeno, pero empieza ya.",
  "El exito es la suma de pequenos esfuerzos repetidos dia tras dia.",
  "Un emprendedor ve oportunidades donde otros ven obstaculos.",
  "Tu unica limitacion es tu imaginacion.",
  "El dinero es un excelente servidor, pero un terrible amo.",
  "Invierte en ti mismo, es la mejor inversion que puedes hacer.",
  "La constancia vence lo que la dicha no alcanza.",
  "No esperes el momento perfecto, toma el momento y hazlo perfecto.",
  "El fracaso es simplemente la oportunidad de comenzar de nuevo con mas inteligencia.",
  "Trabaja en silencio, deja que tu exito haga el ruido.",
  "La fortuna favorece a los valientes.",
  "Hoy es un buen dia para construir tu imperio.",
  "El control de tus finanzas es el control de tu destino.",
  "Cada cliente satisfecho es un paso mas hacia tu meta.",
  "La prosperidad comienza con un pensamiento de abundancia.",
  "Tu actitud determina tu altitud en los negocios.",
  "No hay atajos hacia ningun lugar que valga la pena ir.",
  "El esfuerzo de hoy sera la recompensa de manana.",
  "Un peso ahorrado es un peso ganado.",
  "La paciencia es amarga, pero su fruto es dulce.",
  "Emprende con pasion, persevera con disciplina.",
  "Los obstaculos son esas cosas aterradoras que ves cuando quitas los ojos de tu meta.",
  "Hoy decides si sera un buen dia para tu negocio. Hazlo contar.",
]

export function getDailyQuote(): string {
  const dayOfMonth = new Date().getDate()
  return motivationalQuotes[(dayOfMonth - 1) % motivationalQuotes.length]
}
