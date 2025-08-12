import React from "react";
import styles from "../styles/PlayPauseButton.module.css";

type PlayPauseButtonProps = {
  onStart: () => void;
  isPlaying?: boolean;
  className?: string;
};

export default function PlayPauseButton({
  onStart,
  isPlaying = false,
  className,
}: PlayPauseButtonProps) {
  const buttonClass = className ? className : styles.playPauseButton;
  return (
    <button onClick={onStart} className={buttonClass}>
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}
const PlayIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.5rem"
      height="1.5rem"
      viewBox="0 0 24 24"
      fill="var(--c-bg)"
    >
      <path d="M7.22,21.64C6.33,22.2,5,21.5,5,20.47V3.53c0-1.03,1.33-1.73,2.22-1.17l13.43,8.47c0.83,0.53,0.83,1.8,0,2.33L7.22,21.64z" />
    </svg>
  );
};

const PauseIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.5rem"
      height="1.5rem"
      viewBox="0 0 24 24"
      fill="var(--c-bg)"
    >
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </svg>
  );
};
