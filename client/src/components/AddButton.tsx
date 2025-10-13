import styles from "../styles/PlayPauseButton.module.css";
type AddButtonProps = {
  onAdd: () => void;
};
export default function AddButton({ onAdd }: AddButtonProps) {
  return (
    <button
      onClick={onAdd}
      className={(styles.playPauseButton, "button")}
      type="button"
    >
      <AddIcon />
    </button>
  );
}

const AddIcon = () => {
  return (
    <svg
      height="1.5rem"
      version="1.1"
      viewBox="0 0 32 32"
      width="1.5rem"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      fill="var(--c-bg)"
    >
      <g id="Layer_1" />
      <g id="plus">
        <polygon points="32,12 20,12 20,0 12,0 12,12 0,12 0,20 12,20 12,32 20,32 20,20 32,20  " />
      </g>
    </svg>
  );
};
