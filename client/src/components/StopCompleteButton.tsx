import styles from "../styles/PlayPauseButton.module.css";

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
  //   const handleClick;
  return (
    <>
      {isComplete ? (
        <button
          className={(styles.playPauseButton, "button")}
          onClick={onComplete}
        >
          <CompleteIcon />
        </button>
      ) : (
        <button className={(styles.playPauseButton, "button")} onClick={onStop}>
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
        <rect height="1.5rem" width="1.5rem" />
      </g>
    </svg>
  );
};

const CompleteIcon: React.FC = () => {
  return (
    <svg
      width="2.5rem"
      height="1.5rem"
      viewBox="0 0 26 26"
      fill="var(--c-bg)"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Layer_1" />
      <g id="check">
        <g>
          <polygon points="11.941,25.754 0,13.812 5.695,8.117 11.941,14.363 26.305,0 32,5.695 11.941,25.754" />
        </g>
      </g>
    </svg>
  );
};
