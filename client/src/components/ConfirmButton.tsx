import styles from "../styles/Button.module.css";
type ConfirmButtonProps = {
  onConfirm?: () => void;
  btnType?: "button" | "submit" | "reset";
  className?: string;
};

export default function ConfirmButton({
  onConfirm,
  btnType = "button",
  className = `${styles.button}`,
}: ConfirmButtonProps) {
  const cssModule = styles as Record<string, string>;

  const classNames = className
    .split(",")
    .map((s) => s.trim())
    .map((token) => (cssModule[token] ? cssModule[token] : token))
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (onConfirm) {
      onConfirm();
    }
  };
  return (
    <button className={classNames} onClick={handleClick} type={btnType}>
      <CompleteIcon />
    </button>
  );
}

const CompleteIcon: React.FC = () => {
  return (
    <svg
      width="2.5rem"
      height="1.5rem"
      viewBox="0 0 32 24"
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
