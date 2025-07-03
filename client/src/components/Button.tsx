import styles from "./Exercises/ExercisesList.module.css";
type ButtonProps = {
  name: string;
  onClick?: () => void;
};

export default function Button({ name, onClick }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      {name}
    </button>
  );
}
