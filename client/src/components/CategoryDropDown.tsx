import { useExercises } from "../hooks/useExercises";

export default function CategoryDropdown({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: number | "Alle";
  onCategoryChange: (value: number | "Alle") => void;
}) {
  const { categoryTree, isCategoryLoading, renderCategoryOptions } =
    useExercises();

  if (isCategoryLoading) {
    return <p>Kategorien werden geladen...</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Alle") {
      onCategoryChange("Alle");
    } else {
      const numVal = Number(val);
      if (!isNaN(numVal)) {
        onCategoryChange(numVal);
      } else {
        console.error("Ungültige Kategorie-ID:", val);
      }
    }
  };

  return (
    <select className="input" value={selectedCategory} onChange={handleChange} name="category">
      <option value="Alle">Alle Kategorien</option>
      {renderCategoryOptions(categoryTree)}
    </select>
  );
}
