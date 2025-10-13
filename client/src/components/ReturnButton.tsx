import styles from "../styles/PlayPauseButton.module.css";

type ReturnButtonProps = {
  onBack: () => void;
};

export default function ReturnButton({ onBack }: ReturnButtonProps) {
  return (
    <button
      className={(styles.playPauseButton, "button")}
      onClick={onBack}
      type="button"
    >
      <ReturnIcon />
    </button>
  );
}

const ReturnIcon: React.FC = () => {
  return (
    <svg
      height="1.5rem"
      fill="var(--c-bg)"
      version="1.1"
      viewBox="0 0 32 32"
      width="1.5rem"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <path
        d="M15.984,32l5.672-5.672c0,0-3.18-3.18-6.312-6.312H32v-8.023H15.344l6.312-6.32L15.984,0L0,16   L15.984,32z"
        fill="var(--c-bg)"
      />
    </svg>
  );
};
