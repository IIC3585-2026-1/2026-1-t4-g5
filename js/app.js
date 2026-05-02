console.log("App iniciada");

const STORAGE_KEY = "gym-tracker-workouts";
const LEGACY_STORAGE_KEY = "gym-tracker-training-days";
const MAX_VISIBLE_WORKOUTS = 10;
const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado"
];

let workouts = loadWorkouts();
saveWorkouts();

const workoutForm = document.querySelector("#workout-form");
const dateInput = document.querySelector("#date-input");
const exerciseInput = document.querySelector("#exercise-input");
const weightInput = document.querySelector("#weight-input");
const repsInput = document.querySelector("#reps-input");
const dayFilter = document.querySelector("#day-filter");
const workoutList = document.querySelector("#workout-list");

dateInput.value = getTodayDate();

function loadWorkouts() {
  const savedWorkouts = localStorage.getItem(STORAGE_KEY);

  if (savedWorkouts !== null) {
    return JSON.parse(savedWorkouts);
  }

  const legacyTrainingDays = localStorage.getItem(LEGACY_STORAGE_KEY);

  if (legacyTrainingDays !== null) {
    return migrateTrainingDays(JSON.parse(legacyTrainingDays));
  }

  return [];
}

function migrateTrainingDays(trainingDays) {
  if (!Array.isArray(trainingDays)) {
    return [];
  }

  return trainingDays.map((trainingDay) => {
    const date = getMostRecentDateForDay(trainingDay.day);

    return {
      date,
      day: getDayName(date),
      exercises: Array.isArray(trainingDay.exercises)
        ? trainingDay.exercises
        : []
    };
  });
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

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

function getTodayDate() {
  return formatLocalDate(new Date());
}

function getDayName(dateValue) {
  return DAY_NAMES[parseLocalDate(dateValue).getDay()];
}

function getMostRecentDateForDay(dayName) {
  const targetDayIndex = DAY_NAMES.indexOf(dayName);
  const today = new Date();

  if (targetDayIndex === -1) {
    return formatLocalDate(today);
  }

  const dayDifference = (today.getDay() - targetDayIndex + 7) % 7;
  const date = new Date(today);
  date.setDate(today.getDate() - dayDifference);

  return formatLocalDate(date);
}

function formatDisplayDate(dateValue) {
  const date = parseLocalDate(dateValue);
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function findWorkout(dateValue) {
  return workouts.find((workout) => workout.date === dateValue);
}

function findExercise(workout, exerciseName) {
  return workout.exercises.find((exercise) => exercise.name === exerciseName);
}

function createWorkout(dateValue) {
  const newWorkout = {
    date: dateValue,
    day: getDayName(dateValue),
    exercises: []
  };

  workouts.push(newWorkout);
  return newWorkout;
}

function createSet(weight, reps) {
  if (weight === "" || reps === "") {
    return null;
  }

  return {
    weight: Number(weight),
    reps: Number(reps)
  };
}

function getVisibleWorkouts() {
  const selectedDay = dayFilter.value;
  const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

  if (selectedDay === "all") {
    return sortedWorkouts.slice(0, MAX_VISIBLE_WORKOUTS);
  }

  return sortedWorkouts
    .filter((workout) => workout.day === selectedDay)
    .slice(0, MAX_VISIBLE_WORKOUTS);
}

function renderWorkouts() {
  const visibleWorkouts = getVisibleWorkouts();
  workoutList.innerHTML = "";

  if (visibleWorkouts.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "Aun no hay entrenamientos para mostrar.";
    workoutList.appendChild(emptyMessage);
    return;
  }

  visibleWorkouts.forEach((workout) => {
    const workoutCard = document.createElement("article");
    const workoutHeader = document.createElement("header");
    const workoutTitle = document.createElement("h3");
    const workoutDate = document.createElement("p");
    const exerciseList = document.createElement("ul");

    workoutCard.className = "workout-card";
    workoutHeader.className = "workout-card-header";
    workoutDate.className = "workout-date";
    exerciseList.className = "exercise-list";
    workoutTitle.textContent = workout.day;
    workoutDate.textContent = formatDisplayDate(workout.date);

    workout.exercises.forEach((exercise) => {
      const exerciseItem = document.createElement("li");
      const exerciseName = document.createElement("span");

      exerciseItem.className = "exercise-item";
      exerciseName.className = "exercise-name";
      exerciseName.textContent = exercise.name;
      exerciseItem.appendChild(exerciseName);

      if (exercise.sets.length > 0) {
        const setList = document.createElement("ul");
        setList.className = "set-list";

        exercise.sets.forEach((set) => {
          const setItem = document.createElement("li");
          setItem.className = "set-item";
          setItem.textContent = `${set.weight} kg x ${set.reps} reps`;
          setList.appendChild(setItem);
        });

        exerciseItem.appendChild(setList);
      }

      exerciseList.appendChild(exerciseItem);
    });

    workoutHeader.appendChild(workoutTitle);
    workoutHeader.appendChild(workoutDate);
    workoutCard.appendChild(workoutHeader);
    workoutCard.appendChild(exerciseList);
    workoutList.appendChild(workoutCard);
  });
}

function addExerciseToWorkout(dateValue, exerciseName, set) {
  let workout = findWorkout(dateValue);

  if (workout === undefined) {
    workout = createWorkout(dateValue);
  }

  const existingExercise = findExercise(workout, exerciseName);

  if (existingExercise !== undefined) {
    if (set !== null) {
      existingExercise.sets.push(set);
    }
  } else {
    workout.exercises.push({
      name: exerciseName,
      sets: set === null ? [] : [set]
    });
  }

  saveWorkouts();
  renderWorkouts();
}

workoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const dateValue = dateInput.value;
  const exerciseName = exerciseInput.value.trim();
  const set = createSet(weightInput.value, repsInput.value);

  if (dateValue === "" || exerciseName === "") {
    return;
  }

  addExerciseToWorkout(dateValue, exerciseName, set);
  exerciseInput.value = "";
  weightInput.value = "";
  repsInput.value = "";
  exerciseInput.focus();
});

dayFilter.addEventListener("change", renderWorkouts);

renderWorkouts();
