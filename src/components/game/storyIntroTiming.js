const TYPEWRITER_SPEED = 50;
const DIALOG_PAUSE = 1600;

export function buildStoryIntroDialogs(characterName, obraName) {
  return [
    `${characterName}, has sido seleccionado para una importante misión`,
    `El día de hoy en ${obraName}, tu experiencia es crucial para el equipo`,
    `Antes de iniciar la obra, debes completar tu checklist de héroe`,
    `Un gran poder conlleva una gran responsabilidad. ¡Adelante, héroe!`,
  ];
}

export function getStoryIntroDurationMs(characterName, obraName) {
  return buildStoryIntroDialogs(characterName, obraName).reduce(
    (totalDuration, dialog) => totalDuration + dialog.length * TYPEWRITER_SPEED + DIALOG_PAUSE,
    0
  );
}
