import { Request, Response, Router } from "express";
import {
  CombinedExercise,
  Exercise,
  ExerciseForWorkout,
  UserExercise,
} from "../types/exercises";
import { error } from "console";
import { isAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/all-exercises/:id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    try {
      const combinedExercise: CombinedExercise[] =
        await getTransformedCombinedExercise(userId);
      return res.status(200).json({ exercises: combinedExercise });
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(404);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get(
  "/user-exercises/:id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    try {
      const userExercises: CombinedExercise[] =
        await getTransformedUserExercise(userId);
      if (userExercises.length === 0) {
        return res.status(404).json({
          exercise: userExercises,
          message: "No exercises found for this user.",
        });
      }
      res.status(200).json({ exercise: userExercises });
    } catch (error) {
      console.error("Error fetching user exercises", error);
      res.status(404);
    }
  }
);

router.post(
  "/create-exercise",
  isAuthenticated,
  async (req: Request, res: Response) => {
    // console.log("Created exercise req.body", req.body);
    let counter = 4;
    const userId = parseInt(req.body.userId);
    let newExercise: UserExercise = {
      id: counter++,
      title: req.body.title,
      description: req.body.description,
      uid: userId,
    };
    userExerciseList.push(newExercise);

    // const temp = num.id;
    // console.log("Pushed to newExercise:", newExercise);
    res.status(201).json({
      // exercise: {
      //   id: 1,
      //   title: req.body.title,
      //   description: req.body.description,
      //   uid: req.body.userId,
      // },
      exercise: { newExercise },
      message: "Exercise created successfullys",
    });
  }
);

router.put(
  "/edit-exercise",
  isAuthenticated,
  async (req: Request, res: Response) => {
    console.log(req.body);
    try {
      const { title, description } = req.body;
      const id = parseInt(req.body.id);
      const userId = parseInt(req.body.userId);
      console.log(
        "Editing exercise with ID:",
        id,
        "Title:",
        title,
        "Description:",
        description,
        "User ID:",
        userId
      );

      if (isNaN(id) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID or User ID" });
      }

      const index = userExerciseList.findIndex(
        (ex) => ex.id === id && ex.uid === userId
      );

      if (index !== -1) {
        const existingExercise: UserExercise = userExerciseList[index];

        userExerciseList[index] = {
          ...existingExercise,
          title: title || existingExercise.title,
          description: description || existingExercise.description,
        };
        console.log("existing exercise", existingExercise);

        return res.status(200).json({
          message: "Exercise updated successfully",
          exercise: userExerciseList[index],
        });
      } else {
        return res.status(404).json({ message: "Exercise not found" });
      }
    } catch (error) {
      console.error("Error editing exercise:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/exercise/:exerciseId/:userId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const exerciseId = parseInt(req.params.exerciseId);
    const userId = parseInt(req.params.userId);
    const index = userExerciseList.findIndex(
      (ex) => ex.id === exerciseId && ex.uid === userId
    );
    console.log("DELETE", userExerciseList[index]);
    if (index !== -1) {
      userExerciseList.splice(index, 1);
      return res.status(200).json({
        exercise: exerciseList,
        message: "Exercise deleted successfully",
      });
    } else {
      return res.status(404).json({ message: "Exercise not found" });
    }
  }
);

export default router;

const exerciseList: Exercise[] = [
  {
    id: 1,
    title: "Pushup",
    description:
      "A basic upper body exercise focusing on the chest, shoulders, and triceps.",
  },
  {
    id: 2,
    title: "Squat",
    description:
      "A fundamental exercise targeting the lower body, including quads and glutes.",
  },
  {
    id: 3,
    title: "Plank",
    description:
      "A core exercise that builds strength and stability in the abdomen and back.",
  },
  {
    id: 4,
    title: "Lunge",
    description: "An exercise to strengthen the legs and improve balance.",
  },
  {
    id: 5,
    title: "Burpee",
    description:
      "A full-body exercise that combines a squat, pushup, and jump.",
  },
  {
    id: 6,
    title: "Deadlift",
    description:
      "A weightlifting exercise that targets the lower back, glutes, and hamstrings.",
  },
  {
    id: 7,
    title: "Bicep Curl",
    description: "An upper body exercise to target the biceps.",
  },
  {
    id: 8,
    title: "Tricep Dip",
    description: "An exercise to build strength in the triceps and shoulders.",
  },
  {
    id: 9,
    title: "Mountain Climber",
    description: "A cardiovascular exercise that strengthens the core.",
  },
  {
    id: 10,
    title: "Situp",
    description: "A basic core exercise focusing on the abdominals.",
  },
  {
    id: 11,
    title: "Russian Twist",
    description: "A core exercise to improve oblique strength.",
  },
  {
    id: 12,
    title: "Pullup",
    description: "An upper body exercise targeting the back and biceps.",
  },
  {
    id: 13,
    title: "Leg Raise",
    description: "A core exercise that targets the lower abdominals.",
  },
  {
    id: 14,
    title: "Bench Press",
    description: "A weightlifting exercise to build chest strength.",
  },
  {
    id: 15,
    title: "Overhead Press",
    description: "An upper body exercise focusing on the shoulders.",
  },
  {
    id: 16,
    title: "Chest Fly",
    description: "An exercise to target the chest muscles.",
  },
  {
    id: 17,
    title: "Leg Press",
    description: "A machine-based exercise for the lower body.",
  },
  {
    id: 18,
    title: "Calf Raise",
    description: "An exercise to strengthen the calves.",
  },
  {
    id: 19,
    title: "Shoulder Shrug",
    description: "An exercise focusing on the trapezius muscles.",
  },
  {
    id: 20,
    title: "Bent-over Row",
    description: "A back exercise that targets the lats and rhomboids.",
  },
  {
    id: 21,
    title: "Crunch",
    description: "A core exercise focusing on the upper abdominals.",
  },
  {
    id: 22,
    title: "Hamstring Curl",
    description: "A lower body exercise targeting the hamstrings.",
  },
  {
    id: 23,
    title: "Lat Pulldown",
    description: "A machine exercise targeting the back and biceps.",
  },
  {
    id: 24,
    title: "Seated Row",
    description: "A back exercise to build strength in the middle back.",
  },
  {
    id: 25,
    title: "Dumbbell Fly",
    description: "An exercise for the chest performed with dumbbells.",
  },
  {
    id: 26,
    title: "Chest Press",
    description: "A machine exercise to strengthen the chest.",
  },
  {
    id: 27,
    title: "Skullcrusher",
    description: "An exercise focusing on tricep development.",
  },
  {
    id: 28,
    title: "Cable Crossover",
    description: "A cable machine exercise to work the chest.",
  },
  {
    id: 29,
    title: "Pec Deck",
    description: "A machine exercise targeting the chest muscles.",
  },
  {
    id: 30,
    title: "Good Morning",
    description:
      "A lower back exercise that also targets the glutes and hamstrings.",
  },
  {
    id: 31,
    title: "Ab Rollout",
    description: "A core exercise to build abdominal strength and stability.",
  },
  {
    id: 32,
    title: "Hyperextension",
    description: "An exercise focusing on the lower back.",
  },
  {
    id: 33,
    title: "Hanging Leg Raise",
    description: "A core exercise performed hanging to target the abs.",
  },
  {
    id: 34,
    title: "Reverse Crunch",
    description: "A core exercise targeting the lower abdominals.",
  },
  {
    id: 35,
    title: "Side Plank",
    description:
      "A core exercise to improve oblique and overall core strength.",
  },
  {
    id: 36,
    title: "Kettlebell Swing",
    description: "A dynamic exercise focusing on the core and lower body.",
  },
  {
    id: 37,
    title: "Farmer's Walk",
    description: "A functional exercise to build grip strength and endurance.",
  },
  {
    id: 38,
    title: "Step-Up",
    description: "A lower body exercise focusing on quads and glutes.",
  },
  {
    id: 39,
    title: "Box Jump",
    description: "A plyometric exercise to build explosive leg power.",
  },
  {
    id: 40,
    title: "Wall Sit",
    description: "A lower body endurance exercise targeting the quads.",
  },
  {
    id: 41,
    title: "Tuck Jump",
    description:
      "A plyometric exercise to improve agility and explosive power.",
  },
  {
    id: 42,
    title: "Bridge",
    description: "A core and lower body exercise focusing on the glutes.",
  },
  {
    id: 43,
    title: "Windmill",
    description: "A core exercise to enhance flexibility and oblique strength.",
  },
  {
    id: 44,
    title: "Side Lunge",
    description: "A lower body exercise focusing on adductors and quads.",
  },
  {
    id: 45,
    title: "High Knees",
    description: "A cardiovascular exercise to improve speed and endurance.",
  },
  {
    id: 46,
    title: "Jumping Jack",
    description: "A full-body exercise to increase cardiovascular fitness.",
  },
  {
    id: 47,
    title: "Flutter Kick",
    description: "A core exercise targeting the lower abdominals.",
  },
  {
    id: 48,
    title: "Bear Crawl",
    description: "A full-body exercise to improve strength and coordination.",
  },
  {
    id: 49,
    title: "Inchworm",
    description: "A dynamic stretch and warm-up exercise.",
  },
  {
    id: 50,
    title: "Donkey Kick",
    description: "A lower body exercise targeting the glutes.",
  },
];

const userExerciseList: UserExercise[] = [
  {
    id: 1,
    title: "Bench Dip",
    description: "An exercise to strengthen the triceps and shoulders.",
    uid: 1, // Example user ID
  },
  {
    id: 2,
    title: "Goblet Squat",
    description: "A squat variation using a kettlebell or dumbbell.",
    uid: 1, // Example user ID
  },
  {
    id: 3,
    title: "Single-leg Deadlift",
    description: "A balance and strength exercise for the lower body.",
    uid: 2, // Example user ID
  },
];

// const exerciseForWorkout: ExerciseForWorkout[] = exerciseList.map(
//   (exercise) => ({
//     id: exercise.id,
//     title: exercise.title,
//     description: exercise.description,
//     repetitions: Math.floor(Math.random() * 15) + 5, // Random repetitions between 5 and 20
//     sets: Math.floor(Math.random() * 3) + 1, // Random sets between 1 and 3
//     weight: 0, // Default weight, can be adjusted later
//   })
// );

async function getExercise(): Promise<Exercise[]> {
  try {
    const exercises: Exercise[] = await exerciseList;
    if (!exercises || exercises.length === 0) {
      console.error("No exercises found.");
      return [];
    }
    return exerciseList;
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
}

async function getTransformedExercise(): Promise<CombinedExercise[]> {
  const exercise: Exercise[] = await getExercise();
  const transformExercise: CombinedExercise[] = exercise.map((exercise) => ({
    compositeKey: `exercise-${exercise.id}`,
    originalId: exercise.id,
    title: exercise.title,
    description: exercise.description,
    isUserCreated: false,
  }));
  return transformExercise;
}

async function getUserExercise(): Promise<UserExercise[]> {
  try {
    const userExercises: UserExercise[] = await userExerciseList;
    if (!userExercises || userExercises.length === 0) {
      console.error("No user exercises found.");
      return [];
    }
    return userExercises;
  } catch (error) {
    console.error("Error fetching user exercises:", error);
    return [];
  }
}

async function getTransformedUserExercise(
  uid: number
): Promise<CombinedExercise[]> {
  try {
    const userExercise: UserExercise[] = await getUserExercise();
    const filteredUserExercise = userExercise.filter(
      (exercise) => exercise.uid === uid
    );
    // console.log(userExercise);
    if (filteredUserExercise.length === 0) {
      console.error("No user exercises found for this user.");
      return [];
    }
    const transformUserExercise: CombinedExercise[] = filteredUserExercise.map(
      (exercise) => ({
        compositeKey: `user-exercise-${exercise.id}`,
        originalId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        isUserCreated: true,
      })
    );
    return transformUserExercise;
  } catch (error) {
    console.error("Error fetching user exercises:", error);
    return [];
  }
}

export async function getTransformedCombinedExercise(
  uid: number
): Promise<CombinedExercise[]> {
  try {
    const transformedExercise = await getTransformedExercise();
    const transformedUserExercise = await getTransformedUserExercise(uid);
    if (
      transformedExercise.length === 0 ||
      transformedUserExercise.length === 0
    ) {
      console.error(
        "Error fetching exercises. Exercises: ",
        transformedExercise.length,
        "User Exercises:",
        transformedUserExercise.length,
        error
      );
    }
    return [...transformedExercise, ...transformedUserExercise];
  } catch (error) {
    console.error("Error fetching combined exercises:", error);
    return [];
  }
}

// export { exerciseForWorkout };
