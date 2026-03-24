type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <input
      className="input"
      type="text"
      id="searchInput"
      value={value}
      placeholder={placeholder || "Suchen..."}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
