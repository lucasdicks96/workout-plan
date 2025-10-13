import styles from "../styles/PlayPauseButton.module.css";
type EditButtonProps = {
  onEdit: () => void;
};

export default function EditButton({ onEdit }: EditButtonProps) {
  return (
    <button
      className={(styles.playPauseButton, "button")}
      onClick={onEdit}
      type="button"
    >
      <EditIcon />
    </button>
  );
}

const EditIcon = () => {
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
      <g id="pen_x5F_alt2">
        <g>
          <path d="M30.828,1.172c-1.562-1.562-4.094-1.562-5.656,0L10.047,16.301    c1.352,0.352,2.602,1.031,3.617,2.047c1.031,1.031,1.688,2.289,2.039,3.609L30.828,6.828C32.391,5.266,32.391,2.734,30.828,1.172z    " />
          <path d="M10.836,26.832c1.562-1.562,1.562-4.094,0-5.656s-4.094-1.562-5.656,0L0,32L10.836,26.832z" />
        </g>
      </g>
    </svg>
  );
};
