import React from "react";
import { useLongPress } from "use-long-press";

export default function LongPressTest() {
  const bind = useLongPress(() => {
    alert("Long press detectado!");
    console.log("[DEBUG] Long press detectado!");
  }, { threshold: 500 });

  return (
    <div
      {...bind}
      style={{
        width: 200,
        height: 100,
        background: "#ff9800",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: 18,
        borderRadius: 12,
        margin: "40px auto"
      }}
    >
      Segure aqui (Long Press)
    </div>
  );
}
