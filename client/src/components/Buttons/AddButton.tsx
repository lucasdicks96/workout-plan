import styles from "../../styles/Button.module.css";
type AddButtonProps = {
  onAdd: () => void;
  className?: string;
};
export default function AddButton({
  onAdd,
  className = `${styles.button}`,
}: AddButtonProps) {
  const cssModule = styles as Record<string, string>;

  const classNames = className
    .split(",")
    .map((s) => s.trim())
    .map((token) => (cssModule[token] ? cssModule[token] : token))
    .filter(Boolean)
    .join(" ");

  return (
    <button onClick={onAdd} className={`${classNames}`} type="button">
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
