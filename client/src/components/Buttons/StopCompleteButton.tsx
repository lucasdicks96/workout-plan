import styles from "../../styles/Button.module.css";
import ConfirmButton from "./ConfirmButton";

type StopCompleteButtonProps = {
  isComplete: boolean;
  onStop: () => void;
  onComplete: () => void;
};

export default function StopCompleteButton({
  isComplete,
  onStop,
  onComplete,
}: StopCompleteButtonProps) {
  return (
    <>
      {isComplete ? (
        <ConfirmButton onConfirm={onComplete} />
      ) : (
        <button className={styles.button} onClick={onStop} type="button">
          <StopIcon />
        </button>
      )}
    </>
  );
}

const StopIcon: React.FC = () => {
  return (
    <svg
      width="1.5rem"
      height="1.5rem"
      viewBox="0 0 24 24"
      fill="var(--c-bg)"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Layer_1" />
      <g id="stop">
        <rect height="100%" width="100%" />
      </g>
    </svg>
  );
};
