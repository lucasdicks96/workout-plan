import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Category, Exercise } from "../schemas/exercise.schema";
import { apiService } from "../services/apiService";

/**
 * Repräsentiert eine geglättete Kategorie im Pre-Order-DFS-Format.
 * Diese reine Datenstruktur entkoppelt die hierarchische Baumlogik vollständig
 * von der UI-Schicht und ermöglicht ein einfaches Rendern (z. B. in Dropdowns oder Checkbox-Listen)
 * über die Eigenschaft `depth` zur optischen Einrückung.
 */
export interface FlattenedCategory {
  /** Die eindeutige Datenbank-ID der Kategorie */
  id: number;
  /** Der sichtbare Name der Kategorie (z. B. "Arme" oder "Bizeps") */
  name: string;
  /** Die hierarchische Tiefenebene im Baum (0 = Root, 1 = Kind, 2 = Enkel usw.) */
  depth: number;
}

/**
 * Custom Hook zur zentralen Verwaltung und Filterung von Übungen mit Kategorie-Hierarchien.
 *
 * Bietet folgende Kernfunktionen:
 * - Asynchrones Laden und Deduplizieren von Übungen und Kategoriebäumen.
 * - Hierarchisches Filtern: Wählt man eine Oberkategorie (z. B. "Arme"), matcht die Filterung auch alle Unterkategorien ("Bizeps", "Trizeps").
 * - Streng-Modus für Unterkategorien (`strictSubcategory`): Schließt Geschwister-Kategorien bei gezielter Auswahl aus (z. B. kein Trizeps, wenn Bizeps gewählt ist).
 * - Multi-Select mit Auto-Selection: Wählt man eine Unterkategorie, werden alle Vorfahren automatisch mitgewählt. Wählt man ab, werden alle Nachkommen automatisch entfernt.
 * - Performantes Glätten des Kategoriebaums (`flattenCategoryTree`) mittels LIFO-Stack (Pre-Order DFS).
 *
 * @returns Ein Objekt mit reaktiven Zuständen, Setter-Funktionen, gefilterten Listen und Helper-Methoden.
 */
export function useExercises() {
  /** Wenn true, matchen Unterkategorien nur direkte Vorfahren/Nachkommen und ignorieren Geschwister im selben Ast. */
  const strictSubcategory: boolean = true;
  /** Steuert das interne Debug-Logging in der Konsole. In Production stets auf false setzen. */
  const debugMode: boolean = false;

  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | "Alle">(
    "Alle",
  );

  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const location = useLocation();

  /**
   * Lädt alle verfügbaren Übungen asynchron über den API-Service, dedupliziert
   * den Datensatz anhand der eindeutigen Übungs-ID und aktualisiert den State.
   *
   * @async
   * @returns {Promise<void>}
   */
  const fetchAllExercises = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.getExercises();
      if (response.data && Array.isArray(response.data)) {
        // Deduplizierung: Behält nur das erste Vorkommen jeder Übungs-ID
        const uniqueExercises: Exercise[] = response.data.filter(
          (ex: Exercise, index: number, self: Exercise[]) =>
            index === self.findIndex((e: Exercise) => e.id === ex.id),
        );
        setExerciseList(uniqueExercises);
      } else {
        console.warn("Ungültige API-Antwort: Kein exercises-Array");
        setExerciseList([]);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Übungen:", error);
      setExerciseList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reagiert auf Änderungen des Pfades (`location.pathname`).
   * Löst automatisch ein Neuladen aller Übungen über `fetchAllExercises()` aus,
   * sobald der Benutzer die Übersichtsseite (`/exercises`) aufruft.
   */
  useEffect(() => {
    if (location.pathname === "/exercises") {
      fetchAllExercises();
    }
  }, [location.pathname, fetchAllExercises]);

  /**
   * Extrahiert rekursiv alle Kategorie-IDs aus einem Array von Kategorie-Objekten
   * (inklusive sämtlicher verschachtelter `children`-Elemente).
   *
   * @param {Category[] | undefined} categories - Array von Kategorie-Objekten (z. B. aus `exercise.category`).
   * @returns {number[]} Ein abgeflachtes Array einzigartiger Kategorie-IDs.
   */
  const getAllCategoryIdsFromTree = useCallback(
    (categories: Category[] | undefined): number[] => {
      if (!Array.isArray(categories) || categories.length === 0) return [];

      const ids = new Set<number>();
      function recurse(cat: Category): void {
        if (!cat || !Number.isFinite(cat.id)) return;
        ids.add(cat.id);
        if (cat.children && Array.isArray(cat.children)) {
          cat.children.forEach(recurse);
        }
      }
      categories.forEach(recurse);
      return Array.from(ids);
    },
    [],
  );

  /**
   * Lädt den vollständigen hierarchischen Kategoriebaum asynchron von der API
   * und hinterlegt ihn im State.
   *
   * @async
   * @returns {Promise<void>}
   */
  const fetchCategoryTree = useCallback(async (): Promise<void> => {
    try {
      setIsCategoryLoading(true);
      const response = await apiService.getCategoryTree();
      if (response.data && Array.isArray(response.data)) {
        setCategoryTree(response.data);
      } else {
        console.warn("Ungültige API-Antwort: Kein categories-Array");
        setCategoryTree([]);
      }
    } catch (error) {
      console.error("Fehler beim Laden des Kategoriebaums:", error);
      setCategoryTree([]);
    } finally {
      setIsCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllExercises();
  }, [fetchAllExercises]);

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  /**
   * Memoisiere Map zur schnellen Traversierung von unten nach oben (Upward-Traversal).
   * Mappt jede Kategorie-ID auf ihre direkte Parent-ID (oder `null` bei Root-Kategorien).
   *
   * @type {Map<number, number | null>}
   */
  const parentMap = useMemo((): Map<number, number | null> => {
    const map = new Map<number, number | null>();
    function buildParentMap(categories: Category[] | undefined): void {
      if (!Array.isArray(categories)) return;
      categories.forEach((cat: Category) => {
        if (cat.parent_id !== undefined && Number.isFinite(cat.id)) {
          map.set(cat.id, cat.parent_id);
        }
        if (cat.children && Array.isArray(cat.children)) {
          buildParentMap(cat.children);
        }
      });
    }
    buildParentMap(categoryTree);
    return map;
  }, [categoryTree]);

  /**
   * Memoisiere Map für schnelle Kind-Zugriffe (Downward-Traversal).
   * Mappt jede Kategorie-ID auf ein aufsteigend sortiertes Array der IDs ihrer direkten Kinder.
   * Berücksichtigt sowohl verschachtelte `children`-Arrays als auch flache `parent_id`-Verweise.
   *
   * @type {Map<number, number[]>}
   */
  const categoryMap = useMemo((): Map<number, number[]> => {
    const map = new Map<number, number[]>();
    if (!Array.isArray(categoryTree) || categoryTree.length === 0) return map;

    const allCategories: Category[] = [];
    function collectFlat(cats: Category[] | undefined): void {
      if (!Array.isArray(cats)) return;
      cats.forEach((cat: Category) => {
        allCategories.push(cat);
        if (cat.children && Array.isArray(cat.children)) {
          collectFlat(cat.children);
        }
      });
    }
    collectFlat(categoryTree);

    allCategories.forEach((cat: Category) => {
      const catId = Number(cat.id);
      const parentId = cat.parent_id ? Number(cat.parent_id) : null;

      if (Number.isFinite(catId)) {
        if (parentId && Number.isFinite(parentId)) {
          if (!map.has(parentId)) map.set(parentId, []);
          const children = map.get(parentId)!;
          if (!children.includes(catId)) children.push(catId);
        } else {
          if (!map.has(catId)) map.set(catId, []);
        }

        if (cat.children && Array.isArray(cat.children)) {
          const nestedChildren = cat.children
            .map((c: Category) => Number(c.id))
            .filter(Number.isFinite);
          map.set(catId, nestedChildren);
        }
      }
    });

    map.forEach((children) => children.sort((a, b) => a - b));
    return map;
  }, [categoryTree]);

  /**
   * Memoisiere Map für O(1)-Lookups von Kategorie-Objekten anhand ihrer ID.
   * Flacht den Baum iterativ über unendliche Hierarchie-Ebenen ab, um auch tiefe
   * Unterkategorien direkt greifbar zu machen.
   *
   * @type {Map<number, Category>}
   */
  const idToCategoryMap = useMemo((): Map<number, Category> => {
    const map = new Map<number, Category>();
    if (!Array.isArray(categoryTree) || categoryTree.length === 0) return map;

    const allCategories: Category[] = [];
    categoryTree.forEach((cat: Category) => {
      allCategories.push(cat);
      if (cat.children && Array.isArray(cat.children)) {
        cat.children.forEach((child: Category) => {
          allCategories.push(child);
          if (child.children && Array.isArray(child.children)) {
            child.children.forEach((grand: Category) => {
              allCategories.push(grand);
              let level = grand;
              while (
                level.children &&
                Array.isArray(level.children) &&
                level.children.length > 0
              ) {
                const nextLevel = level.children[0];
                if (nextLevel) {
                  allCategories.push(nextLevel);
                  level = nextLevel;
                } else break;
              }
            });
          }
        });
      }
    });

    allCategories.forEach((cat: Category) => {
      const catId = Number(cat.id);
      if (Number.isFinite(catId) && !map.has(catId)) {
        map.set(catId, cat);
      }
    });

    return map;
  }, [categoryTree]);

  /**
   * Ermittelt iterativ mittels Breitensuche (BFS-Queue) alle Nachkommen-IDs
   * (Kinder, Enkel, Urenkel usw.) einer bestimmten Kategorie.
   *
   * @param {number} id - Die ID der Start-Kategorie (Parent).
   * @param {Map<number, number[]>} map - Die `categoryMap` mit den Kind-Beziehungen.
   * @returns {number[]} Ein aufsteigend sortiertes Array aller Nachkommen-IDs (ohne die Start-ID selbst).
   */
  const getAllDescendants = useCallback(
    (id: number, map: Map<number, number[]>): number[] => {
      const numId = Number(id);
      if (!map || !Number.isFinite(numId) || !map.has(numId)) return [];

      const descendants = new Set<number>();
      const queue: number[] = [];
      const directChildren = map.get(numId) || [];

      directChildren.forEach((childId: number) => {
        const numChild = Number(childId);
        if (Number.isFinite(numChild) && !descendants.has(numChild)) {
          descendants.add(numChild);
          queue.push(numChild);
        }
      });

      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = map.get(current) || [];

        children.forEach((grandChildId: number) => {
          const numGrand = Number(grandChildId);
          if (Number.isFinite(numGrand) && !descendants.has(numGrand)) {
            descendants.add(numGrand);
            queue.push(numGrand);
          }
        });
      }

      return Array.from(descendants).sort((a, b) => a - b);
    },
    [],
  );

  /**
   * Ermittelt iterativ alle Vorfahren-IDs (Eltern, Großeltern usw.) einer Kategorie
   * durch schrittweises Hochklettern über den `parent_id`-Verweis in der `idToCategoryMap`.
   * Schützt sich durch ein `visited`-Set automatisch vor Endlosschleifen bei zyklischen Daten.
   *
   * @param {number} id - Die ID der Start-Kategorie.
   * @returns {number[]} Ein Array aller Vorfahren-IDs (ohne die Start-ID selbst).
   */
  const getAllAncestors = useCallback(
    (id: number): number[] => {
      const numId = Number(id);
      if (!Number.isFinite(numId)) return [];

      const ancestors: number[] = [];
      let currentId = numId;
      const visited = new Set<number>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const currentCat = idToCategoryMap.get(currentId);
        if (!currentCat) break;

        const parentId = currentCat.parent_id
          ? Number(currentCat.parent_id)
          : null;
        if (!parentId || !Number.isFinite(parentId) || visited.has(parentId)) {
          break;
        }

        ancestors.push(parentId);
        currentId = parentId;
      }

      return ancestors;
    },
    [idToCategoryMap],
  );

  /**
   * Prüft, ob eine Übung zur ausgewählten Filter-Kategorie passt – unter Berücksichtigung der gesamten Baum-Hierarchie.
   *
   * Match-Logik:
   * 1. Direkter Match: Die Übung ist exakt mit der ausgewählten Kategorie getaggt.
   * 2. Hierarchischer Match: Die Übung liegt in einer Unterkategorie des gewählten Filters (z. B. Filter "Arme" findet Übung "Bizeps").
   * 3. Reverse Match: Der gewählte Filter ist ein Nachkomme der Übungs-Kategorie.
   * 4. Streng-Modus (`strictSubcategory`): Verhindert, dass Geschwister-Kategorien unter demselben Parent fälschlicherweise matchen (z. B. schließt Filter "Bizeps" reine "Trizeps"-Übungen aus, obwohl beide unter "Arme" hängen).
   *
   * @param {Category[] | undefined} exerciseCategories - Die dem Übungs-Objekt zugeordneten Kategorien.
   * @param {number | "Alle"} selectedCat - Die aktuell gewählte Filter-Kategorie-ID oder der String "Alle".
   * @param {string} [exerciseTitle] - Optionaler Übungstitel für Debug-Log-Ausgaben.
   * @returns {boolean} `true`, wenn die Übung den Filterkriterien entspricht, sonst `false`.
   */
  const matchesCategoryWithTree = useCallback(
    (
      exerciseCategories: Category[] | undefined,
      selectedCat: number | "Alle",
      exerciseTitle?: string,
    ): boolean => {
      const selCatNum = Number(selectedCat);
      if (selectedCat === "Alle" || !Number.isFinite(selCatNum)) return true;
      if (!Array.isArray(exerciseCategories) || exerciseCategories.length === 0)
        return false;

      const allExerciseTreeIds = getAllCategoryIdsFromTree(exerciseCategories);
      if (allExerciseTreeIds.length === 0) return false;

      const directMatch = allExerciseTreeIds.includes(selCatNum);

      let hierarchyMatch = false;
      if (
        !directMatch &&
        categoryTree?.length > 0 &&
        parentMap &&
        categoryMap
      ) {
        const ancestorsOfSelected = getAllAncestors(selCatNum);
        const descendantsOfSelected = getAllDescendants(selCatNum, categoryMap);

        allExerciseTreeIds.forEach((exerciseId: number) => {
          if (!Number.isFinite(exerciseId)) return;
          const ancestorsOfExercise = getAllAncestors(exerciseId);
          if (
            ancestorsOfSelected.includes(exerciseId) ||
            descendantsOfSelected.includes(exerciseId) ||
            ancestorsOfExercise.includes(selCatNum)
          ) {
            hierarchyMatch = true;
          }

          if (strictSubcategory && ancestorsOfSelected.length > 0) {
            const parent = ancestorsOfSelected[0];
            const siblings = categoryMap.get(parent) || [];
            if (
              siblings.length > 1 &&
              !allExerciseTreeIds.includes(selCatNum)
            ) {
              hierarchyMatch = false;
            }
          }
        });
      }

      return directMatch || hierarchyMatch;
    },
    [
      getAllCategoryIdsFromTree,
      categoryTree,
      categoryMap,
      getAllAncestors,
      getAllDescendants,
      strictSubcategory,
      parentMap,
    ],
  );

  /**
   * Memoisiertes Array aller Übungen, die sowohl den aktuellen Suchbegriff (`searchTerm`)
   * im Titel enthalten als auch die hierarchischen Kategorie-Filterkriterien erfüllen.
   * Dedupliziert das Ergebnis sicherheitshalber nach Übungs-ID.
   *
   * @type {Exercise[]}
   */
  const filteredExercises = useMemo((): Exercise[] => {
    if (!categoryTree?.length || !exerciseList?.length) return [];

    const matched: Exercise[] = exerciseList.filter((ex: Exercise) => {
      if (
        !ex ||
        !ex.category ||
        !Array.isArray(ex.category) ||
        ex.category.length === 0
      ) {
        return false;
      }
      return (
        (ex.title || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
        matchesCategoryWithTree(ex.category, selectedCategory, ex.title)
      );
    });

    return matched.filter(
      (ex: Exercise, index: number, self: Exercise[]) =>
        index === self.findIndex((e: Exercise) => e.id === ex.id),
    );
  }, [
    exerciseList,
    searchTerm,
    selectedCategory,
    matchesCategoryWithTree,
    categoryTree,
  ]);

  /**
   * Togglet die Auswahl einer Kategorie für Multi-Select-Formulare (z. B. beim Erstellen/Bearbeiten von Übungen)
   * und wendet eine automatische hierarchische Konsistenzlogik an:
   * - Bei Select: Die gewählte ID sowie automatisch alle Vorfahren (Parents/Roots) werden hinzugefügt.
   * - Bei Deselect: Die ID sowie automatisch alle untergeordneten Nachkommen (Kinder/Enkel) werden entfernt.
   *
   * @param {number} categoryId - Die zu toggelnde Kategorie-ID.
   */
  const handleCategorySelect = useCallback(
    (categoryId: number): void => {
      const numId = Number(categoryId);
      if (!Number.isFinite(numId)) return;

      setSelectedCategories((prev: number[]) => {
        if (!Array.isArray(prev)) return [];
        const prevNums = prev.map((id) => Number(id));

        if (prevNums.includes(numId)) {
          // Deselect: Die ID selbst und alle untergeordneten Nachkommen entfernen
          const toRemove = new Set<number>([numId]);
          let descendants: number[] = [];
          if (categoryMap && categoryMap.size > 0) {
            descendants = getAllDescendants(numId, categoryMap);
          }

          descendants.forEach((descId: number) => {
            if (Number.isFinite(descId)) {
              toRemove.add(Number(descId));
            }
          });

          return prevNums.filter((id: number) => !toRemove.has(Number(id)));
        } else {
          // Select: Die ID und alle übergeordneten Vorfahren hinzufügen
          const newSelected = [...prevNums, numId];
          const ancestors = getAllAncestors(numId);

          ancestors.forEach((ancId: number) => {
            const numAnc = Number(ancId);
            if (!newSelected.includes(numAnc) && Number.isFinite(numAnc)) {
              newSelected.push(numAnc);
            }
          });

          return newSelected;
        }
      });
    },
    [getAllAncestors, getAllDescendants, categoryMap],
  );

  /**
   * Glättet den verschachtelten Kategoriebaum performant mittels LIFO-Stack (Pre-Order DFS Traversierung).
   * Wandelt die baumartige Datenstruktur in eine flache, eindimensionale Liste reiner Datenobjekte um,
   * bei der die visuelle Reihenfolge (Eltern vor Kindern) exakt gewahrt bleibt und die Einrückungsebene (`depth`)
   * mitgeführt wird.
   *
   * @param {Category[]} cats - Das Array der zu glättenden Kategorien (in der Regel die Root-Elemente).
   * @param {number} [startDepth=0] - Die initiale Einrückungsebene (Standard: 0 für Root).
   * @returns {FlattenedCategory[]} Ein flaches Array von Datenobjekten mit `id`, `name` und `depth`.
   */
  const flattenCategoryTree = useCallback(
    (cats: Category[], startDepth: number = 0): FlattenedCategory[] => {
      if (!Array.isArray(cats)) return [];

      const flatList: FlattenedCategory[] = [];
      const stack: { cat: Category; currentDepth: number }[] = [];

      // Initial: Roots reverse pushen, damit LIFO von links nach rechts (bzw. oben nach unten) abarbeitet
      for (let i = cats.length - 1; i >= 0; i--) {
        const cat = cats[i];
        if (cat && Number.isFinite(cat.id)) {
          stack.push({ cat, currentDepth: startDepth });
        }
      }

      while (stack.length > 0) {
        const { cat, currentDepth } = stack.pop()!;

        flatList.push({
          id: cat.id,
          name: cat.name,
          depth: currentDepth,
        });

        if (
          cat.children &&
          Array.isArray(cat.children) &&
          cat.children.length > 0
        ) {
          // Kinder reverse pushen, damit das erste Kind als nächstes vom Stack gepopt wird
          [...cat.children].reverse().forEach((child: Category) => {
            if (child && Number.isFinite(child.id)) {
              stack.push({ cat: child, currentDepth: currentDepth + 1 });
            }
          });
        }
      }

      return flatList;
    },
    [],
  );

  return {
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
    fetchAllExercises,
    isCategoryLoading,
    categoryTree,
    fetchCategoryTree,
    flattenCategoryTree, // <-- Ersetzt veraltete JSX-Generatoren wie renderCategoryOptions!
    selectedCategories,
    setSelectedCategories,
    handleCategorySelect,
  };
}
