import styles from "../styles/PlayPauseButton.module.css";
type ConfirmButtonProps = {
  onConfirm?: () => void;
  btnType?: "button" | "submit" | "reset";
};

export default function ConfirmButton({
  onConfirm,
  btnType = "button",
}: ConfirmButtonProps) {
  const handleClick = () => {
    if (onConfirm) {
      onConfirm();
    }
  };
  return (
    <button
      className={(styles.playPauseButton, "button")}
      onClick={handleClick}
      type={btnType}
    >
      <CompleteIcon />
    </button>
  );
}

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
