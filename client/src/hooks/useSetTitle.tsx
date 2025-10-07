import { useContext, useEffect } from "react";
import { TitleContext } from "../context/TitleContext";

export function useSetTitle(title: string) {
  const setTitle = useContext(TitleContext);
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}
