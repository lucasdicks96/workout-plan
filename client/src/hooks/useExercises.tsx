import { useCallback, useEffect, useMemo, useState } from "react";
import { apiService } from "../services/apiService";
import { Category, Exercise } from "../schemas/exercise.schema";

/**
 * Custom Hook zur Verwaltung von Übungen mit Kategorie-Filterung.
 * Lädt Übungen und Kategoriebaum, filtert nach Suche und ausgewählter Kategorie (inklusive Hierarchie).
 * Unterstützt Streng-Modus für Unterkategorien (schließt Geschwister aus, z. B. Trizeps bei Bizeps-Auswahl).
 *
 * @param strictSubcategory - Wenn true, Unterkategorien matchen nur direkte Nachkommen/Vorfahren, ignoriert Geschwister unter demselben Parent.
 * @returns Objekt mit States, Settern und Hilfsfunktionen.
 */
export function useExercises() {
  const strictSubcategory: boolean = true;
  const debugMode: boolean = false; // Umschaltung für Debug-Logs; in Production auf false setzen

  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | "Alle">(
    "Alle",
  );

  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  /**
   * Lädt alle Übungen aus API, dedupliziert nach ID und updated State.
   */
  const fetchAllExercises = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.getExercises();
      if (response.data && Array.isArray(response.data)) {
        // Deduplizierung: Filtert einzigartige nach ID
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
   * Extrahiert alle Kategorie-IDs aus dem Übungs-Kategoriebaum (selbst + Nachkommen).
   * Handhabt undefinierte/ leere Arrays;
   *
   * @param categories - Array von Category-Objekten aus exercise.category.
   * @returns Abgeflachtes Array einzigartiger IDs.
   */
  const getAllCategoryIdsFromTree = useCallback(
    (categories: Category[] | undefined): number[] => {
      if (!Array.isArray(categories) || categories.length === 0) return [];

      const ids = new Set<number>();
      function recurse(cat: Category): void {
        if (!cat || !Number.isFinite(cat.id)) return; // Guard pro Kategorie
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
   * Lädt den Kategoriebaum aus API und updated State.
   * Handhabt leere/ungültige Antworten.
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
   * Baut eine Parent-Map aus dem Kategoriebaum für Vorfahren-Traversal.
   */
  const parentMap = useMemo((): Map<number, number | null> => {
    const map = new Map<number, number | null>();
    function buildParentMap(categories: Category[] | undefined): void {
      if (!Array.isArray(categories)) return; // Guard: Ungültiger Input
      categories.forEach((cat: Category) => {
        if (cat.parent_id !== undefined && Number.isFinite(cat.id)) {
          map.set(cat.id, cat.parent_id);
        }
        if (cat.children && Array.isArray(cat.children)) {
          buildParentMap(cat.children); // Rekursiv nur für Parent-Setzung
        }
      });
    }
    buildParentMap(categoryTree);
    return map;
  }, [categoryTree]);

  /**
   * Baut eine Children-Map iterativ aus Kategorie-Daten.
   * Nutzt children-Arrays bei Nested; Fallback zu parent_id für flache Teile.
   *
   * @returns Map<ID, direkte Child-IDs>.
   */
  const categoryMap = useMemo((): Map<number, number[]> => {
    const map = new Map<number, number[]>();
    if (!Array.isArray(categoryTree) || categoryTree.length === 0) {
      if (debugMode) console.warn("categoryTree leer – categoryMap empty");
      return map;
    }

    // Sammle alle in flacher Liste für parent_id-Gruppierung
    const allCategories: Category[] = []; // Flache Liste für Iteration
    function collectFlat(cats: Category[] | undefined): void {
      if (!Array.isArray(cats)) return;
      cats.forEach((cat: Category) => {
        allCategories.push(cat); // Selbst hinzufügen
        if (cat.children && Array.isArray(cat.children)) {
          collectFlat(cat.children); // Iterativ sammeln
        }
      });
    }
    collectFlat(categoryTree);

    // Nach parent_id gruppieren
    allCategories.forEach((cat: Category) => {
      const catId = Number(cat.id);
      const parentId = cat.parent_id ? Number(cat.parent_id) : null; // parent_id aus Daten

      if (Number.isFinite(catId)) {
        if (parentId && Number.isFinite(parentId)) {
          if (!map.has(parentId)) map.set(parentId, []);
          const children = map.get(parentId)!;
          if (!children.includes(catId)) children.push(catId);
        } else {
          // Root: Leere Children-Liste setzen
          if (!map.has(catId)) map.set(catId, []);
        }

        // Nested-Children überschreiben, falls verfügbar
        if (cat.children && Array.isArray(cat.children)) {
          const nestedChildren = cat.children
            .map((c: Category) => Number(c.id))
            .filter(Number.isFinite);
          map.set(catId, nestedChildren);
        }
      }
    });

    // Children sortieren
    map.forEach((children) => children.sort((a, b) => a - b));

    if (debugMode) {
      console.log("categoryMap built iteratively:");
      console.log("  - Arme (4):", map.get(4)); // [20,21,22]
      console.log("  - Alle Keys:", Array.from(map.keys()));
    }

    return map;
  }, [categoryTree, debugMode]);

  // Effect für Logging von Maps und Tree (nach Initialisierung, TDZ-sicher (temporal dead zone))
  useEffect(() => {
    if (debugMode && categoryTree?.length > 0 && parentMap && categoryMap) {
      const tempParentMap = parentMap;
      const tempCategoryMap = categoryMap;
      console.log(
        "Global parentMap (Bizeps 20 -> Arme 4):",
        tempParentMap.get(20),
      );
      console.log(
        "Global categoryMap (Arme 4 -> [20,21,22]):",
        tempCategoryMap.get(4),
      );
      console.log(
        "Global Category Tree Roots:",
        categoryTree.slice(0, 5).map((c) => ({ id: c.id, name: c.name })),
      );
    }
  }, [categoryTree, parentMap, categoryMap, debugMode]);

  // Effect für Logging von Übungen (nach Laden)
  useEffect(() => {
    if (
      debugMode &&
      exerciseList?.length > 0 &&
      categoryTree?.length > 0 &&
      getAllCategoryIdsFromTree
    ) {
      exerciseList.forEach((ex: Exercise) => {
        if (
          ex.category &&
          Array.isArray(ex.category) &&
          ex.category.length > 0
        ) {
          const rootIds = ex.category.map((cat: Category) => cat.id);
          const allIds = getAllCategoryIdsFromTree(ex.category);
          console.log(
            `Übung "${ex.title}": Roots [${rootIds.join(
              ", ",
            )}], All IDs [${allIds.join(", ")}]`,
          );
        }
      });
    }
  }, [exerciseList, categoryTree, getAllCategoryIdsFromTree, debugMode]);

  /**
   * Baut eine flache Map von ID zu Category-Objekt iterativ auf.
   * Flacht verschachtelte Struktur ab (Roots + alle Children) für O(1)-Lookups.
   *
   * @returns Map<id, Category> für alle Kategorien.
   */
  const idToCategoryMap = useMemo((): Map<number, Category> => {
    const map = new Map<number, Category>();
    if (!Array.isArray(categoryTree) || categoryTree.length === 0) {
      if (debugMode) console.warn("categoryTree leer – idToCategoryMap empty");
      return map;
    }

    // Iterativ abflachen: Sammle alle Kategorien (wichtig für Children-Suche in getAllAncestors)
    const allCategories: Category[] = [];
    categoryTree.forEach((cat: Category) => {
      allCategories.push(cat); // Root hinzufügen
      if (cat.children && Array.isArray(cat.children)) {
        cat.children.forEach((child: Category) => {
          allCategories.push(child); // Direkte Child
          if (child.children && Array.isArray(child.children)) {
            // Iterativ für Level 3+ (in deinem Fall leer; erweitert bei tieferen Bäumen)
            child.children.forEach((grand: Category) => {
              allCategories.push(grand);
              // While-Loop für weitere Levels
              let level = grand;
              while (
                level.children &&
                Array.isArray(level.children) &&
                level.children.length > 0
              ) {
                const nextLevel = level.children[0]; // Annahme: Flach; bei mehreren Children erweitern
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

    // Map bauen (Duplikate vermeiden)
    allCategories.forEach((cat: Category) => {
      const catId = Number(cat.id);
      if (Number.isFinite(catId) && !map.has(catId)) {
        map.set(catId, cat);
      }
    });

    if (debugMode) {
      console.log(
        "idToCategoryMap built: Size",
        map.size,
        "Entries: Arme(4) has parent_id:",
        map.get(4)?.parent_id,
        "Bizeps(20) parent_id:",
        map.get(20)?.parent_id,
      );
    }

    return map;
  }, [categoryTree, debugMode]);

  /**
   * Holt iterativ alle Nachkommen-IDs mit BFS (Queue).
   * Enthält direkte Children + tiefere Levels.
   *
   * @param id - Start-Kategorie-ID (Parent).
   * @param map - Map von ID zu direkten Child-IDs.
   * @returns Array von Nachkommen-IDs (exkl. selbst).
   */
  const getAllDescendants = useCallback(
    (id: number, map: Map<number, number[]>): number[] => {
      const numId = Number(id);
      if (!map || !Number.isFinite(numId) || !map.has(numId)) {
        if (debugMode)
          console.log(`getAllDescendants(${numId}): No map/entry – []`);
        return [];
      }

      const descendants = new Set<number>();
      const queue: number[] = []; // BFS-Queue für schrittweises Durchlaufen
      const directChildren = map.get(numId) || [];

      if (debugMode) {
        console.log(
          `getAllDescendants(${numId}): Direct [${directChildren.join(", ")}]`,
        );
      }

      // Initial: Direkte Children zu Set und Queue hinzufügen
      directChildren.forEach((childId: number) => {
        const numChild = Number(childId);
        if (Number.isFinite(numChild) && !descendants.has(numChild)) {
          descendants.add(numChild);
          queue.push(numChild); // Für BFS-Processing
        }
      });

      // BFS: Queue iterativ verarbeiten (Level 2+)
      while (queue.length > 0) {
        const current = queue.shift()!; // Erstes Element entnehmen
        const children = map.get(current) || [];

        children.forEach((grandChildId: number) => {
          const numGrand = Number(grandChildId);
          if (Number.isFinite(numGrand) && !descendants.has(numGrand)) {
            descendants.add(numGrand);
            queue.push(numGrand); // Nächstes Level enqueue
          }
        });
      }

      const result = Array.from(descendants).sort((a, b) => a - b);
      if (debugMode && result.length > 0) {
        console.log(
          `getAllDescendants(${numId}) iterative BFS: [${result.join(", ")}]`,
        ); // z.B. [20,21,22]
      }

      return result;
    },
    [debugMode],
  );

  /**
   * Holt iterativ alle Vorfahren-IDs für eine Kategorie-ID.
   * Nutzt flache idToCategoryMap; Loop upward via parent_id.
   * Stoppt bei Root (parent_id null);
   *
   * @param id - Start-Kategorie-ID.
   * @returns Array von Vorfahren-IDs (exkl. selbst).
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

        // Lookup in flacher Map
        const currentCat = idToCategoryMap.get(currentId);
        if (!currentCat) {
          if (debugMode)
            console.log(
              `getAllAncestors(${numId}): No cat for ${currentId} – stop`,
            );
          break;
        }

        const parentId = currentCat.parent_id
          ? Number(currentCat.parent_id)
          : null;
        if (!parentId || !Number.isFinite(parentId) || visited.has(parentId)) {
          if (debugMode)
            console.log(
              `getAllAncestors(${numId}): Root or cycle at ${currentId} – stop`,
            );
          break;
        }

        ancestors.push(parentId);
        currentId = parentId;
      }

      if (debugMode && ancestors.length > 0) {
        console.log(`getAllAncestors(${numId}): [${ancestors.join(", ")}]`); // z.B. für 20: [4]
      } else if (debugMode) {
        console.log(`getAllAncestors(${numId}): [] (root or no parent)`);
      }

      return ancestors;
    },
    [idToCategoryMap, debugMode],
  );

  /**
   * Prüft, ob eine Übung zur ausgewählten Kategorie passt, unter Berücksichtigung der Baum-Hierarchie.
   * Direkter Match: selectedCat in Übungs-Tree-IDs.
   * Hierarchie-Match: selectedCat ist Vorfahr/Nachkomme von Übungs-IDs.
   * Strict-Mode: Für Unterkategorien, Geschwister-Matches ausschließen (z. B. kein Trizeps bei Bizeps).
   *
   * @param exerciseCategories - Kategorien aus exercise.category.
   * @param selectedCat - Ausgewählte Kategorie-ID oder "Alle".
   * @param exerciseTitle - Optionaler Titel für Logging.
   * @returns True, wenn Match (direkt oder Hierarchie).
   */
  const matchesCategoryWithTree = useCallback(
    (
      exerciseCategories: Category[] | undefined,
      selectedCat: number | "Alle",
      exerciseTitle?: string,
    ): boolean => {
      const selCatNum = Number(selectedCat);
      if (selectedCat === "Alle" || !Number.isFinite(selCatNum)) return true; // "Alle" matcht alles; ungültige ID -> überspringen
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
          if (!Number.isFinite(exerciseId)) return; // Guard ungültige ID
          const ancestorsOfExercise = getAllAncestors(exerciseId);
          if (
            ancestorsOfSelected.includes(exerciseId) || // Übung ist Vorfahr (z.B. Arme 4 für Bizeps 20)
            descendantsOfSelected.includes(exerciseId) || // Übung unter selectedCat
            ancestorsOfExercise.includes(selCatNum) // selectedCat ist Vorfahr der Übung
          ) {
            hierarchyMatch = true;
          }

          // Streng-Modus für Unterkategorien: Nur direkte Treffer, keine Geschwister
          if (strictSubcategory && ancestorsOfSelected.length > 0) {
            const parent = ancestorsOfSelected[0]; // Direkter Parent (z.B. 4 für 20)
            const siblings = categoryMap.get(parent) || [];
            if (
              siblings.length > 1 &&
              !allExerciseTreeIds.includes(selCatNum)
            ) {
              hierarchyMatch = false; // Bei mehreren Geschwistern und keinem direkten selectedCat ausschließen
            }
          }
        });
      }

      const hasMatch = directMatch || hierarchyMatch;

      // Minimales Logging: Nur bei Matches, mit Guards
      if (debugMode && hasMatch && categoryTree?.length > 0) {
        console.log(
          `Match for "${
            exerciseTitle || "Unknown"
          }": SelectedCat ${selCatNum}, Tree IDs [${allExerciseTreeIds.join(
            ", ",
          )}], Direct: ${directMatch}, Hierarchy: ${hierarchyMatch}`,
        );
      }

      return hasMatch;
    },
    [
      getAllCategoryIdsFromTree,
      categoryTree,
      categoryMap,
      getAllAncestors,
      getAllDescendants,
      strictSubcategory,
      debugMode,
      parentMap,
    ],
  );

  /**
   * Memoisiertes gefiltertes und einzigartiges Übungs-Array basierend auf Suche und Kategorie.
   * Frühe Returns bei ungeladenen States; filtert null-Kategorien.
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
        return false; // Keine Kategorien
      }
      return (
        (ex.title || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
        matchesCategoryWithTree(ex.category, selectedCategory, ex.title)
      );
    });

    // Nach ID deduplizieren
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

  // Effect für Filter-Logging (nach Memo-Update)
  useEffect(() => {
    if (debugMode) {
      console.log(
        `Gefilterte Übungen (${selectedCategory}): ${
          filteredExercises.length
        } - ${filteredExercises.map((e) => e.title).join(", ")}`,
      );
    }
  }, [filteredExercises, selectedCategory, debugMode]);

  /**
   * Toggled Kategorien im Multi-Select um, mit hierarchischem Auto-Select/Deselect.
   * - Bei Select: Fügt ID + alle Vorfahren (Parents) automatisch hinzu.
   * - Bei Deselect: Entfernt ID + alle Nachkommen (Children + Enkel) automatisch.
   *
   * @param categoryId - Zu togglende Kategorie-ID.
   */
  const handleCategorySelect = useCallback(
    (categoryId: number): void => {
      const numId = Number(categoryId); // Expliziter Cast: Sicherstellen von Number
      if (!Number.isFinite(numId)) return;

      setSelectedCategories((prev: number[]) => {
        if (!Array.isArray(prev)) return []; // Guard: Ungültiger Prev-State

        // Prev zu Numbers casten (vermeidet String/Number-Mismatch)
        const prevNums = prev.map((id) => Number(id));

        if (prevNums.includes(numId)) {
          // Deselect: Sammle alle zu entfernenden IDs (Parent + Nachkommen)
          const toRemove = new Set<number>([numId]); // Mit Parent starten

          // Nachkommen holen (z.B. für 4: [20,21,22])
          let descendants: number[] = [];
          if (categoryMap && categoryMap.size > 0) {
            descendants = getAllDescendants(numId, categoryMap);
          } else {
            console.warn(
              `categoryMap leer für Deselect ${numId} – entferne nur Parent (lade categoryTree?)`,
            );
          }

          descendants.forEach((descId: number) => {
            if (Number.isFinite(descId)) {
              toRemove.add(Number(descId)); // Cast + zu Set hinzufügen
            }
          });

          if (debugMode) {
            console.log(
              `Deselect ${numId}: Prev [${prevNums.join(
                ", ",
              )}], Descendants [${descendants.join(
                ", ",
              )}], ToRemove [${Array.from(toRemove).join(", ")}]`,
            );
          }

          // Einmaliger Filter: Alle toRemove entfernen
          const newSelected = prevNums.filter(
            (id: number) => !toRemove.has(Number(id)),
          );

          if (debugMode && descendants.length > 0) {
            console.log(
              `Auto-deselected ${
                descendants.length
              } descendants for ${numId}. New selected: [${newSelected.join(
                ", ",
              )}]`,
            );
          }

          return newSelected;
        } else {
          // Select: numId + alle Vorfahren (Parents) auto hinzufügen
          const newSelected = [...prevNums, numId];

          // Alle Vorfahren holen (z.B. für 20: [4])
          const ancestors = getAllAncestors(numId);

          // Vorfahren hinzufügen, falls nicht da
          ancestors.forEach((ancId: number) => {
            const numAnc = Number(ancId);
            if (!newSelected.includes(numAnc) && Number.isFinite(numAnc)) {
              newSelected.push(numAnc);
              if (debugMode) {
                console.log(`Auto-added ancestor for ${numId}: ${numAnc}`);
              }
            }
          });

          if (debugMode && ancestors.length > 0) {
            console.log(
              `Auto-added ancestors for ${numId}: [${ancestors.join(
                ", ",
              )}]. New selected: [${newSelected.join(", ")}]`,
            );
          }

          return newSelected;
        }
      });
    },
    [getAllAncestors, getAllDescendants, categoryMap, debugMode],
  );

  /**
   * Rendert flache Kategorie-Optionen mit Einrückung für Dropdown.
   * Iterativ mit Stack (pre-order DFS) für Baum-Struktur.
   * Korrekte Reihenfolge: Parent vor Children (z. B. Arme vor Bizeps).
   *
   * @param cats - Array von Kategorien.
   * @param depth - Start-Tiefe für Einrückung (default 0).
   * @returns Array von JSX option-Elementen.
   */
  const renderCategoryOptions = useCallback(
    (cats: Category[], depth: number = 0): JSX.Element[] => {
      if (!Array.isArray(cats)) return []; // Guard: Ungültiges Input

      const options: JSX.Element[] = []; // Ergebnis: Push für korrekte pre-order
      const stack: { cat: Category; currentDepth: number }[] = []; // Stack für DFS

      // Initial: Roots in umgekehrter Reihenfolge pushen (letzter Root zuerst gepopt)
      for (let i = cats.length - 1; i >= 0; i--) {
        const cat = cats[i];
        if (cat && Number.isFinite(cat.id)) {
          stack.push({ cat, currentDepth: depth });
        }
      }

      // Stack verarbeiten (pre-order: Process vor Children push)
      while (stack.length > 0) {
        const { cat, currentDepth } = stack.pop()!; // LIFO: Top zuerst
        const indent = "\u00A0\u00A0 ".repeat(currentDepth); // Einrückung pro Level

        // Option processieren (Parent vor Children)
        const option = (
          <option key={cat.id} value={cat.id}>
            {indent + cat.name}
          </option>
        );
        options.push(option); // Push: Baut pre-order auf

        // Children in umgekehrter Reihenfolge pushen (first child zuerst gepopt)
        if (
          cat.children &&
          Array.isArray(cat.children) &&
          cat.children.length > 0
        ) {
          // Reverse für korrekte left-to-right Order
          [...cat.children].reverse().forEach((child: Category) => {
            if (child && Number.isFinite(child.id)) {
              stack.push({ cat: child, currentDepth: currentDepth + 1 });
            }
          });
        }
      }

      if (debugMode) {
        console.log(
          `renderCategoryOptions: Generierte ${options.length} Optionen (iterativ, pre-order)`,
        );
      }

      return options;
    },
    [debugMode],
  );

  /**
   * Rendert hierarchische Checkboxes für Multi-Select.
   * Iterativ mit Stack (pre-order DFS) für Einrückung und Hierarchie.
   * Korrekte Reihenfolge: Parent vor Children (z. B. Arme vor Bizeps).
   *
   * @param cats - Array von Kategorien.
   * @param selectedCategories - Aktuell ausgewählte IDs.
   * @param handleCategorySelect - Toggle-Funktion.
   * @param depth - Start-Tiefe (default 0).
   * @returns Array von JSX label-Elementen.
   */
  const renderCategoryCheckboxes = useCallback(
    (
      cats: Category[],
      selectedCategories: number[],
      handleCategorySelect: (id: number) => void,
      depth: number = 0,
    ): JSX.Element[] => {
      if (!Array.isArray(cats) || !Array.isArray(selectedCategories)) return []; // Guard: Ungültiges Input

      const labels: JSX.Element[] = []; // Ergebnis: Push für pre-order
      const stack: { cat: Category; currentDepth: number }[] = []; // Stack für DFS

      // Initial: Roots reverse pushen (letzter Root zuerst gepopt → korrekte Order)
      for (let i = cats.length - 1; i >= 0; i--) {
        const cat = cats[i];
        if (cat && Number.isFinite(cat.id)) {
          stack.push({ cat, currentDepth: depth });
        }
      }

      // Stack verarbeiten (pre-order: Checkbox vor Children)
      while (stack.length > 0) {
        const { cat, currentDepth } = stack.pop()!; // LIFO
        const indent = " ".repeat(2 * currentDepth); // Einrückung (2 Spaces)

        // Checkbox processieren
        const checkbox = (
          <label
            key={cat.id}
            style={{
              display: "block",
              marginLeft: `${currentDepth * 20}px`,
              userSelect: "none",
              padding: "2px 0",
            }}
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.id)}
              onChange={() => handleCategorySelect(cat.id)}
            />
            {indent + cat.name}
          </label>
        );
        labels.push(checkbox); // Push: Pre-order aufbauen

        // Children reverse pushen (first child zuerst gepopt)
        if (
          cat.children &&
          Array.isArray(cat.children) &&
          cat.children.length > 0
        ) {
          [...cat.children].reverse().forEach((child: Category) => {
            if (child && Number.isFinite(child.id)) {
              stack.push({ cat: child, currentDepth: currentDepth + 1 });
            }
          });
        }
      }

      if (debugMode) {
        console.log(
          `renderCategoryCheckboxes: Generierte ${labels.length} Checkboxes (iterativ, pre-order)`,
        );
      }

      return labels;
    },
    [debugMode],
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
    renderCategoryOptions,
    renderCategoryCheckboxes,
    selectedCategories,
    setSelectedCategories,
    handleCategorySelect,
  };
}
