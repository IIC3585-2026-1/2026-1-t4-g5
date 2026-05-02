const STORAGE_KEY = "gym-tracker-workouts";
const LEGACY_STORAGE_KEY = "gym-tracker-training-days";
const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado"
];

const seedButton = document.querySelector("#seed-button");
const clearButton = document.querySelector("#clear-button");
const seedStatus = document.querySelector("#seed-status");

function parseLocalDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayName(dateValue) {
  return DAY_NAMES[parseLocalDate(dateValue).getDay()];
}

function getRecentDatesForDay(dayName, amount) {
  const targetDayIndex = DAY_NAMES.indexOf(dayName);
  const today = new Date();
  const dates = [];

  if (targetDayIndex === -1) {
    return dates;
  }

  const dayDifference = (today.getDay() - targetDayIndex + 7) % 7;
  const firstDate = new Date(today);
  firstDate.setDate(today.getDate() - dayDifference);

  for (let index = 0; index < amount; index += 1) {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() - index * 7);
    dates.push(formatLocalDate(date));
  }

  return dates;
}

function createWorkout(date, exercises) {
  return {
    date,
    day: getDayName(date),
    exercises
  };
}

function createProgressionWorkouts(dayName, amount, buildExercises) {
  return getRecentDatesForDay(dayName, amount)
    .reverse()
    .map((date, index) => createWorkout(date, buildExercises(index)));
}

function createSeedWorkouts() {
  const mondayWorkouts = createProgressionWorkouts("Lunes", 12, (index) => [
    {
      name: "Squat",
      sets: [
        { weight: 85 + index, reps: 5 },
        { weight: 85 + index, reps: 5 },
        { weight: 85 + index, reps: 5 }
      ]
    },
    {
      name: "Bench Press",
      sets: [
        { weight: 60 + index, reps: 6 },
        { weight: 60 + index, reps: 6 }
      ]
    },
    {
      name: "Barbell Row",
      sets: [
        { weight: 55 + index, reps: 8 },
        { weight: 55 + index, reps: 8 }
      ]
    }
  ]);

  const wednesdayWorkouts = createProgressionWorkouts("Miercoles", 6, (index) => [
    {
      name: "Deadlift",
      sets: [
        { weight: 110 + index * 2, reps: 4 },
        { weight: 110 + index * 2, reps: 4 }
      ]
    },
    {
      name: "Overhead Press",
      sets: [
        { weight: 38 + index, reps: 6 },
        { weight: 38 + index, reps: 6 }
      ]
    }
  ]);

  const fridayWorkouts = createProgressionWorkouts("Viernes", 6, (index) => [
    {
      name: "Front Squat",
      sets: [
        { weight: 65 + index, reps: 5 },
        { weight: 65 + index, reps: 5 }
      ]
    },
    {
      name: "Pull Up",
      sets: [
        { weight: 0, reps: 6 + index },
        { weight: 0, reps: 6 + index }
      ]
    }
  ]);

  return [...mondayWorkouts, ...wednesdayWorkouts, ...fridayWorkouts]
    .sort((a, b) => b.date.localeCompare(a.date));
}

function seedData() {
  const workouts = createSeedWorkouts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  seedStatus.textContent = `Se cargaron ${workouts.length} entrenamientos de prueba.`;
}

function clearData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  seedStatus.textContent = "Datos locales eliminados.";
}

seedButton.addEventListener("click", seedData);
clearButton.addEventListener("click", clearData);
